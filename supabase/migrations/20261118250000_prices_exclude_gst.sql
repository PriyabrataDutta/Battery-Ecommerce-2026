-- Prices are now stored and shown EXCLUDING GST; checkout adds GST
-- (default 18%, or the product's gst_rate) and rounds the total to the rupee.
-- Decided 2026-11-18: e.g. Amaron 105D31L ₹7,627.12 + ₹1,372.88 GST = ₹9,000
-- (the price list's "Incl. GST" figure).
--
--   subtotal (excl. GST) − discount + GST + shipping ± round off = total

-- One-time conversion of the GST-inclusive prices imported earlier.
UPDATE public.products p
   SET price                  = round(p.price / (1 + r.rate / 100), 2),
       price_with_exchange    = round(p.price_with_exchange / (1 + r.rate / 100), 2),
       price_without_exchange = round(p.price_without_exchange / (1 + r.rate / 100), 2),
       mrp                    = CASE WHEN p.mrp IS NULL THEN NULL ELSE round(p.mrp / (1 + r.rate / 100), 2) END,
       exchange_rebate        = CASE WHEN p.exchange_rebate IS NULL THEN NULL ELSE round(p.exchange_rebate / (1 + r.rate / 100), 2) END
  FROM (SELECT p2.id, coalesce(g.rate, (SELECT rate FROM gst_rates WHERE is_default LIMIT 1), 18) AS rate
          FROM public.products p2 LEFT JOIN gst_rates g ON g.id = p2.gst_rate_id) r
 WHERE r.id = p.id;

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
  v_free_threshold numeric;
  v_gross numeric := 0;
  v_pre_round numeric;
  v_total numeric;
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
    v_gross := v_gross + v_unit * v_qty * (1 + v_rate / 100);
  END LOOP;

  -- Promo
  IF nullif(trim(p_promo), '') IS NOT NULL THEN
    SELECT * INTO v_offer FROM offers
     WHERE upper(code) = upper(trim(p_promo)) AND is_active
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at > now());
    IF NOT FOUND THEN
      v_promo_error := 'Invalid or expired promo code';
    ELSIF v_gross < v_offer.min_order_total THEN  -- minimum is on the GST-inclusive amount customers see
      v_promo_error := format('This code needs a minimum order of ₹%s', v_offer.min_order_total);
    ELSE
      v_discount := least(v_subtotal, CASE
        WHEN v_offer.type = 'percent' THEN round(v_subtotal * v_offer.value / 100, 2)
        ELSE v_offer.value END);
      v_promo := jsonb_build_object('code', v_offer.code, 'label', v_offer.title);
    END IF;
  END IF;

  -- GST added per line on the discounted, pre-GST amount.
  FOR v_line IN SELECT * FROM jsonb_array_elements(v_lines) LOOP
    v_line_disc := CASE WHEN v_subtotal > 0
      THEN (v_line->>'line_total')::numeric * (v_subtotal - v_discount) / v_subtotal ELSE 0 END;
    v_rate := (v_line->>'gst_rate')::numeric;
    v_line_tax := round(v_line_disc * v_rate / 100, 2);
    v_tax := v_tax + v_line_tax;
    v_out := v_out || (v_line || jsonb_build_object('tax', v_line_tax));
  END LOOP;

  -- Shipping
  SELECT value->'methods', (value->>'free_threshold')::numeric INTO v_methods, v_free_threshold
    FROM site_settings WHERE key = 'shipping_settings';
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
  -- Admin → Settings → Shipping: free standard shipping above a threshold.
  IF p_delivery = 'standard' AND coalesce(v_free_threshold, 0) > 0
     AND v_subtotal - v_discount + v_tax >= v_free_threshold THEN
    v_shipping := 0;
  END IF;

  -- Total rounded to the rupee (GST invoices show the difference as "Round off").
  v_pre_round := v_subtotal - v_discount + v_tax + v_shipping;
  v_total := round(v_pre_round);

  RETURN jsonb_build_object(
    'lines', v_out,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'promo', v_promo,
    'promo_error', v_promo_error,
    'tax', v_tax,
    'shipping', v_shipping,
    'delivery', jsonb_build_object('id', p_delivery, 'label', v_delivery_label),
    'round_off', v_total - v_pre_round,
    'total', v_total
  );
END;
$$;
