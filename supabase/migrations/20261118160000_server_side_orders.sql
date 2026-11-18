-- Phase 1.1–1.3 + 0.5: the server prices and places orders; the browser no
-- longer writes orders directly.
--
-- Pricing rules (agreed 2026-11-18):
--   * Product prices INCLUDE GST. GST is extracted per line:
--       tax = discounted_line × rate / (100 + rate)
--   * Unit price: price_with_exchange when exchange chosen and offered,
--     else price_without_exchange, else price.
--   * Promo discount comes off the subtotal and is allocated to lines in
--     proportion to their value before GST is extracted.
--   * Shipping per delivery method from site_settings.shipping_settings
--     (defaults ₹0 / ₹299 / ₹499); not taxed separately.
--   * total = subtotal − discount + shipping.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS with_exchange boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gst_rate numeric,
  ADD COLUMN IF NOT EXISTS tax_amount numeric;

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1001;

-- Promo codes previously hard-coded in the frontend bundle.
INSERT INTO public.offers (title, code, type, value, min_order_total, is_active) VALUES
  ('10% off your order', 'KACHI10', 'percent', 10, 0, true),
  ('₹500 off orders above ₹5,000', 'FLAT500', 'flat', 500, 5000, true),
  ('15% off orders above ₹8,000', 'FESTIVE15', 'percent', 15, 8000, true)
ON CONFLICT (code) DO NOTHING;

-- Codes must be entered, not browsed.
DROP POLICY IF EXISTS offers_public_read ON public.offers;

-- 0.5: customers can no longer insert orders directly.
DROP POLICY IF EXISTS orders_self_insert ON public.orders;

-- Internal: price a cart. p_items = [{product_id, qty, with_exchange}].
-- Raises on bad input; promo problems are returned as promo_error so a quote
-- can still show totals.
CREATE OR REPLACE FUNCTION public._price_order(p_items jsonb, p_delivery text, p_promo text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_qty int;
  v_exch boolean;
  v_p record;
  v_unit numeric;
  v_rate numeric;
  v_default_rate numeric;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_tax numeric := 0;
  v_shipping numeric;
  v_delivery_label text;
  v_offer record;
  v_promo jsonb := NULL;
  v_promo_error text := NULL;
  v_methods jsonb;
  v_line jsonb;
  v_line_disc numeric;
  v_line_tax numeric;
  v_out jsonb := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Your cart is empty or too large' USING ERRCODE = '22023';
  END IF;

  SELECT rate INTO v_default_rate FROM gst_rates WHERE is_default LIMIT 1;
  v_default_rate := coalesce(v_default_rate, 18);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'qty')::int;
    v_exch := coalesce((v_item->>'with_exchange')::boolean, false);
    IF v_qty IS NULL OR v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'Quantity must be between 1 and 20' USING ERRCODE = '22023';
    END IF;

    SELECT p.id, p.name, p.sku, p.slug, p.price, p.price_with_exchange,
           p.price_without_exchange, p.has_exchange, p.stock, g.rate AS gst
      INTO v_p
      FROM products p LEFT JOIN gst_rates g ON g.id = p.gst_rate_id
     WHERE p.id = (v_item->>'product_id')::uuid AND p.status = 'active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in your cart is no longer available' USING ERRCODE = 'P0002';
    END IF;
    IF v_p.stock < v_qty THEN
      RAISE EXCEPTION 'Only % left of %', greatest(v_p.stock, 0), v_p.name USING ERRCODE = 'P0001';
    END IF;

    v_exch := v_exch AND v_p.has_exchange AND v_p.price_with_exchange > 0;
    v_unit := CASE
      WHEN v_exch THEN v_p.price_with_exchange
      WHEN v_p.price_without_exchange > 0 THEN v_p.price_without_exchange
      ELSE v_p.price
    END;
    v_rate := coalesce(v_p.gst, v_default_rate);

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_p.id, 'name', v_p.name, 'sku', v_p.sku, 'slug', v_p.slug,
      'qty', v_qty, 'with_exchange', v_exch, 'unit_price', v_unit,
      'line_total', v_unit * v_qty, 'gst_rate', v_rate);
    v_subtotal := v_subtotal + v_unit * v_qty;
  END LOOP;

  -- Promo
  IF nullif(trim(p_promo), '') IS NOT NULL THEN
    SELECT * INTO v_offer FROM offers
     WHERE upper(code) = upper(trim(p_promo)) AND is_active
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at > now());
    IF NOT FOUND THEN
      v_promo_error := 'Invalid or expired promo code';
    ELSIF v_subtotal < v_offer.min_order_total THEN
      v_promo_error := format('This code needs a minimum order of ₹%s', v_offer.min_order_total);
    ELSE
      v_discount := least(v_subtotal, CASE
        WHEN v_offer.type = 'percent' THEN round(v_subtotal * v_offer.value / 100)
        ELSE v_offer.value END);
      v_promo := jsonb_build_object('code', v_offer.code, 'label', v_offer.title);
    END IF;
  END IF;

  -- GST extracted per line from the discounted, GST-inclusive amount.
  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
    v_line_disc := CASE WHEN v_subtotal > 0
      THEN (v_line->>'line_total')::numeric * (v_subtotal - v_discount) / v_subtotal ELSE 0 END;
    v_rate := (v_line->>'gst_rate')::numeric;
    v_line_tax := round(v_line_disc * v_rate / (100 + v_rate), 2);
    v_tax := v_tax + v_line_tax;
    v_out := v_out || (v_line || jsonb_build_object('tax', v_line_tax));
  END LOOP;

  -- Shipping
  SELECT value->'methods' INTO v_methods FROM site_settings WHERE key = 'shipping_settings';
  SELECT (m->>'price')::numeric, m->>'label' INTO v_shipping, v_delivery_label
    FROM jsonb_array_elements(coalesce(v_methods, '[]'::jsonb)) m WHERE m->>'id' = p_delivery;
  IF v_shipping IS NULL THEN
    SELECT d.price, d.label INTO v_shipping, v_delivery_label FROM (VALUES
      ('standard', 0::numeric, 'Standard Doorstep Delivery'),
      ('express', 299::numeric, 'Express Delivery'),
      ('installation', 499::numeric, 'Doorstep Installation + Old Battery Pickup')
    ) AS d(id, price, label) WHERE d.id = p_delivery;
  END IF;
  IF v_shipping IS NULL THEN
    RAISE EXCEPTION 'Unknown delivery method' USING ERRCODE = '22023';
  END IF;

  RETURN jsonb_build_object(
    'lines', v_out,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'promo', v_promo,
    'promo_error', v_promo_error,
    'tax', v_tax,
    'shipping', v_shipping,
    'delivery', jsonb_build_object('id', p_delivery, 'label', v_delivery_label),
    'total', v_subtotal - v_discount + v_shipping
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public._price_order(jsonb, text, text) FROM PUBLIC, anon, authenticated;

-- Public: price preview for cart/checkout.
CREATE OR REPLACE FUNCTION public.quote_order(p_items jsonb, p_delivery text DEFAULT 'standard', p_promo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public._price_order(p_items, p_delivery, p_promo) $$;
REVOKE EXECUTE ON FUNCTION public.quote_order(jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quote_order(jsonb, text, text) TO anon, authenticated;

-- Place an order atomically: reprice, check promo, reserve stock, write
-- header + items. Everything money-related comes from the database.
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

  v_payment_label := CASE p_payment
    WHEN 'upi' THEN 'UPI'
    WHEN 'card' THEN 'Credit / Debit Card'
    WHEN 'netbanking' THEN 'Net Banking'
    WHEN 'cod' THEN 'Cash on Delivery'
  END;
  IF v_payment_label IS NULL THEN
    RAISE EXCEPTION 'Unknown payment method' USING ERRCODE = '22023';
  END IF;

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
    p_address->>'phone', p_address, nullif(p_address->>'notes', ''),
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
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, jsonb, date, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, jsonb, date, text, text, text) TO authenticated;
