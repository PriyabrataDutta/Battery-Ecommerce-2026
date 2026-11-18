-- 1. Idempotent order placement: place_order(..., p_idempotency_key).
-- 2. Stock follows the order: cancelling restores it, re-opening takes it again.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_key
  ON public.orders (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- The response place_order gives, rebuilt from a saved order (for retries).
CREATE OR REPLACE FUNCTION public._order_result(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'lines', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'product_id', i.product_id, 'name', regexp_replace(i.product_name, ' \(with exchange\)$', ''),
        'sku', i.product_sku, 'slug', p.slug, 'qty', i.qty, 'with_exchange', i.with_exchange,
        'unit_price', i.unit_price, 'line_total', i.unit_price * i.qty,
        'gst_rate', i.gst_rate, 'tax', i.tax_amount) ORDER BY i.created_at)
      FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = o.id), '[]'::jsonb),
    'subtotal', o.subtotal, 'discount', o.discount,
    'promo', CASE WHEN o.promo_code IS NULL THEN NULL
                  ELSE jsonb_build_object('code', o.promo_code, 'label', o.promo_label) END,
    'promo_error', NULL, 'tax', o.tax, 'shipping', o.shipping,
    'delivery', jsonb_build_object('id', o.delivery_method, 'label', o.delivery_label),
    'total', o.total, 'order_id', o.id, 'order_number', o.order_number,
    'payment_label', o.payment_method, 'replayed', true)
  FROM orders o WHERE o.id = p_order_id
$$;
REVOKE EXECUTE ON FUNCTION public._order_result(uuid) FROM PUBLIC, anon, authenticated;

-- New signature (extra arg) replaces the old one; drop it to avoid an ambiguous overload.
DROP FUNCTION IF EXISTS public.place_order(jsonb, text, text, text, jsonb, date, text, text, text);
CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_delivery text,
  p_promo text,
  p_payment text,
  p_address jsonb,
  p_scheduled_date date,
  p_slot text,
  p_slot_label text,
  p_slot_window text,
  p_idempotency_key uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_q jsonb;
  v_line jsonb;
  v_order_id uuid;
  v_order_number text;
  v_payment_label text;
  v_updated int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to place an order' USING ERRCODE = '42501';
  END IF;

  -- Idempotency: a retried request (e.g. after a network timeout) returns the
  -- order it already created instead of creating a second one. The lock makes
  -- two simultaneous identical requests wait for each other.
  IF p_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || p_idempotency_key::text, 0));
    SELECT id INTO v_order_id FROM orders WHERE user_id = v_uid AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN public._order_result(v_order_id);
    END IF;
  END IF;

  -- Methods switched on in Admin → Settings → Payment.
  IF p_payment NOT IN ('cod', 'online')
     OR NOT coalesce((public.available_payment_methods()->>p_payment)::boolean, false) THEN
    RAISE EXCEPTION 'That payment method is not available right now' USING ERRCODE = '22023';
  END IF;
  v_payment_label := CASE p_payment WHEN 'cod' THEN 'Cash on Delivery' ELSE 'Online (Cashfree)' END;

  IF p_address IS NULL OR jsonb_typeof(p_address) <> 'object'
     OR length(coalesce(p_address->>'fullName', '')) < 2
     OR length(coalesce(p_address->>'phone', '')) < 10
     OR coalesce(p_address->>'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     OR coalesce(p_address->>'pincode', '') !~ '^[1-9][0-9]{5}$' THEN
    RAISE EXCEPTION 'Please check your delivery address' USING ERRCODE = '22023';
  END IF;
  IF p_scheduled_date IS NULL OR p_scheduled_date < current_date
     OR p_scheduled_date > current_date + 30 OR nullif(p_slot, '') IS NULL THEN
    RAISE EXCEPTION 'Please choose a valid delivery date and slot' USING ERRCODE = '22023';
  END IF;

  v_q := public._price_order(p_items, p_delivery, p_promo);
  IF v_q->>'promo_error' IS NOT NULL THEN
    RAISE EXCEPTION '%', v_q->>'promo_error' USING ERRCODE = '22023';
  END IF;

  v_order_number := 'KCH-' || lpad(nextval('public.order_number_seq')::text, 6, '0');

  INSERT INTO orders (
    user_id, order_number, status, customer_name, customer_email, customer_phone,
    address, notes, subtotal, discount, tax, shipping, total, promo_code, promo_label,
    payment_method, delivery_method, delivery_label, scheduled_date, scheduled_slot,
    scheduled_slot_label, scheduled_slot_window, idempotency_key
  ) VALUES (
    v_uid, v_order_number, 'pending', p_address->>'fullName', p_address->>'email',
    p_address->>'phone', p_address, NULL,
    (v_q->>'subtotal')::numeric, (v_q->>'discount')::numeric, (v_q->>'tax')::numeric,
    (v_q->>'shipping')::numeric, (v_q->>'total')::numeric,
    v_q->'promo'->>'code', v_q->'promo'->>'label',
    v_payment_label, p_delivery, v_q->'delivery'->>'label', p_scheduled_date, p_slot,
    left(p_slot_label, 80), left(p_slot_window, 80), p_idempotency_key
  ) RETURNING id INTO v_order_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(v_q->'lines') LOOP
    UPDATE products SET stock = stock - (v_line->>'qty')::int
     WHERE id = (v_line->>'product_id')::uuid AND stock >= (v_line->>'qty')::int;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RAISE EXCEPTION 'Only limited stock left of %', v_line->>'name' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO order_items (order_id, product_id, product_name, product_sku, qty,
                             unit_price, with_exchange, gst_rate, tax_amount)
    VALUES (v_order_id, (v_line->>'product_id')::uuid,
            (v_line->>'name') || CASE WHEN (v_line->>'with_exchange')::boolean THEN ' (with exchange)' ELSE '' END,
            v_line->>'sku', (v_line->>'qty')::int, (v_line->>'unit_price')::numeric,
            (v_line->>'with_exchange')::boolean, (v_line->>'gst_rate')::numeric,
            (v_line->>'tax')::numeric);
  END LOOP;

  RETURN v_q || jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number,
                                   'payment_label', v_payment_label);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, jsonb, date, text, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, jsonb, date, text, text, text, uuid) TO authenticated;

-- Stock follows the order status: 'cancelled' and 'refunded' release stock,
-- moving back to any other status takes it again.
CREATE OR REPLACE FUNCTION public.tg_order_stock_on_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE short text;
BEGIN
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    UPDATE products p SET stock = p.stock + i.qty
      FROM (SELECT product_id, sum(qty) qty FROM order_items
             WHERE order_id = NEW.id AND product_id IS NOT NULL GROUP BY product_id) i
     WHERE p.id = i.product_id;
  ELSIF OLD.status IN ('cancelled', 'refunded') AND NEW.status NOT IN ('cancelled', 'refunded') THEN
    SELECT string_agg(p.name, ', ') INTO short
      FROM (SELECT product_id, sum(qty) qty FROM order_items
             WHERE order_id = NEW.id AND product_id IS NOT NULL GROUP BY product_id) i
      JOIN products p ON p.id = i.product_id
     WHERE p.stock < i.qty;
    IF short IS NOT NULL THEN
      RAISE EXCEPTION 'Not enough stock to re-open this order: %', short USING ERRCODE = 'P0001';
    END IF;
    UPDATE products p SET stock = p.stock - i.qty
      FROM (SELECT product_id, sum(qty) qty FROM order_items
             WHERE order_id = NEW.id AND product_id IS NOT NULL GROUP BY product_id) i
     WHERE p.id = i.product_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_order_stock_on_status() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_order_stock_on_status ON public.orders;
CREATE TRIGGER trg_order_stock_on_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_stock_on_status();

-- Expiry now only cancels; the trigger above returns the stock.
CREATE OR REPLACE FUNCTION public.expire_unpaid_online_orders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  UPDATE orders SET status = 'cancelled', payment_status = 'failed',
         notes = concat_ws(E'\n', notes, 'Auto-cancelled: online payment not completed within 30 minutes')
   WHERE payment_method = 'Online (Cashfree)' AND payment_status = 'unpaid'
     AND status = 'pending' AND created_at < now() - interval '30 minutes';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_online_orders() FROM PUBLIC, anon, authenticated;
