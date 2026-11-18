-- Phase 1.5–1.6: Cashfree online payments.
--  * orders.payment_status is set to 'paid' only by the cashfree edge functions
--    (service role) after Cashfree's API confirms the payment.
--  * Payment methods are switched on/off in Admin → Settings → Payment
--    (site_settings.payment_gateway: cod_enabled, online_enabled, mode,
--    cashfree.{test,live}.app_id; secrets in private_settings.payment_secrets).
--  * Unpaid online orders release their stock after 30 minutes (pg_cron).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS cashfree_order_id text,
  ADD COLUMN IF NOT EXISTS payment_ref text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Which methods checkout may offer. Online needs the switch on plus an App ID
-- and secret for the active mode.
CREATE OR REPLACE FUNCTION public.available_payment_methods()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH g AS (
    SELECT coalesce((SELECT value FROM site_settings WHERE key = 'payment_gateway'), '{}'::jsonb) AS v
  ), s AS (
    SELECT coalesce((SELECT value FROM private_settings WHERE key = 'payment_secrets'), '{}'::jsonb) AS v
  )
  SELECT jsonb_build_object(
    'cod', coalesce((g.v->>'cod_enabled')::boolean, true),
    'online', coalesce((g.v->>'online_enabled')::boolean, false)
              AND coalesce(g.v->'cashfree'->(coalesce(g.v->>'mode', 'test'))->>'app_id', '') <> ''
              AND coalesce(s.v->>('cashfree_' || coalesce(g.v->>'mode', 'test') || '_secret'), '') <> '',
    'mode', coalesce(g.v->>'mode', 'test')
  ) FROM g, s
$$;
REVOKE EXECUTE ON FUNCTION public.available_payment_methods() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.available_payment_methods() TO anon, authenticated;

-- Called by the cashfree edge functions only, after Cashfree confirms PAID.
CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_number text, p_payment_ref text, p_amount numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE o record;
BEGIN
  SELECT * INTO o FROM orders WHERE order_number = p_order_number FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF o.payment_status = 'paid' THEN RETURN 'already_paid'; END IF;
  IF p_amount <> o.total THEN
    UPDATE orders SET notes = concat_ws(E'\n', notes, format('⚠ Cashfree paid ₹%s but order total is ₹%s — check before dispatch', p_amount, o.total))
     WHERE id = o.id;
    RETURN 'amount_mismatch';
  END IF;
  UPDATE orders
     SET payment_status = 'paid', payment_ref = p_payment_ref, paid_at = now(),
         status = CASE WHEN status = 'pending' THEN 'paid'::order_status ELSE status END,
         notes = CASE WHEN status = 'cancelled'
                      THEN concat_ws(E'\n', notes, '⚠ Paid after the order expired — refund, or restock and re-open')
                      ELSE notes END
   WHERE id = o.id;
  RETURN 'paid';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(text, text, numeric) FROM PUBLIC, anon, authenticated;

-- Release stock held by online orders nobody paid for.
CREATE OR REPLACE FUNCTION public.expire_unpaid_online_orders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  WITH expired AS (
    UPDATE orders SET status = 'cancelled', payment_status = 'failed',
           notes = concat_ws(E'\n', notes, 'Auto-cancelled: online payment not completed within 30 minutes')
     WHERE payment_method = 'Online (Cashfree)' AND payment_status = 'unpaid'
       AND status = 'pending' AND created_at < now() - interval '30 minutes'
    RETURNING id
  ), restock AS (
    UPDATE products p SET stock = p.stock + i.qty
      FROM (SELECT product_id, sum(qty) qty FROM order_items
             WHERE order_id IN (SELECT id FROM expired) AND product_id IS NOT NULL
             GROUP BY product_id) i
     WHERE p.id = i.product_id
    RETURNING 1
  )
  SELECT count(*) INTO n FROM expired;
  RETURN n;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_online_orders() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('expire-unpaid-online-orders', '*/5 * * * *', 'SELECT public.expire_unpaid_online_orders()');

CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_delivery text,
  p_promo text,
  p_payment text,
  p_address jsonb,
  p_scheduled_date date,
  p_slot text,
  p_slot_label text,
  p_slot_window text
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
    scheduled_slot_label, scheduled_slot_window
  ) VALUES (
    v_uid, v_order_number, 'pending', p_address->>'fullName', p_address->>'email',
    p_address->>'phone', p_address, NULL,
    (v_q->>'subtotal')::numeric, (v_q->>'discount')::numeric, (v_q->>'tax')::numeric,
    (v_q->>'shipping')::numeric, (v_q->>'total')::numeric,
    v_q->'promo'->>'code', v_q->'promo'->>'label',
    v_payment_label, p_delivery, v_q->'delivery'->>'label', p_scheduled_date, p_slot,
    left(p_slot_label, 80), left(p_slot_window, 80)
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
