-- Self-checking test for _price_order / place_order. Leaves nothing behind.
-- Run: supabase db query --linked -f supabase/tests/pricing_check.sql
-- Success = final row says 'pricing ok'; any failed assert raises an error.
-- Prices are stored EXCLUDING GST; checkout adds GST and rounds to the rupee.
begin;

-- Amaron 105D31L from the price list: ₹5,635.59 / ₹7,627.12 excl. GST (= ₹6,650 / ₹9,000 incl.)
insert into products (id, name, slug, sku, price, price_with_exchange, price_without_exchange,
                      has_exchange, stock, status)
values ('00000000-0000-0000-0000-00000000c0de', 'Pricing Test Battery', 'pricing-test-battery',
        'PRICING-TEST', 7627.12, 5635.59, 7627.12, true, 5, 'active'),
       ('00000000-0000-0000-0000-00000000c0df', 'Pricing Test 38B20L', 'pricing-test-38b20l',
        'PRICING-TEST-2', 4237.29, 2711.86, 4237.29, true, 5, 'active');
insert into offers (title, code, type, value, min_order_total, is_active)
values ('Test high minimum', 'TESTMIN50K', 'flat', 100, 50000, true);

do $$
declare q jsonb;
begin
  -- Without exchange: 7,627.12 + 18% GST 1,372.88 = 9,000 (the Excel "Incl. GST" price).
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1}]', 'standard', null);
  assert (q->>'subtotal')::numeric = 7627.12, q::text;
  assert (q->>'tax')::numeric = 1372.88, q::text;
  assert (q->>'total')::numeric = 9000, q::text;
  assert (q->>'round_off')::numeric = 0, q::text;

  -- With exchange: 5,635.59 + 1,014.41 = 6,650.
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1,"with_exchange":true}]', 'standard', null);
  assert (q->>'total')::numeric = 6650, q::text;

  -- 1-paisa case: 2,711.86 + 488.13 = 3,199.99 → round off +0.01 → 3,200.
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0df","qty":1,"with_exchange":true}]', 'standard', null);
  assert (q->>'total')::numeric = 3200, q::text;
  assert (q->>'round_off')::numeric = 0.01, q::text;

  -- Shipping added after GST, not taxed: 2 × with exchange + express 299.
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":2,"with_exchange":true}]', 'express', null);
  assert (q->>'subtotal')::numeric = 11271.18, q::text;
  assert (q->>'total')::numeric = 13300 + 299, q::text;

  -- 10% promo on the pre-GST subtotal, GST on the discounted amount.
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1}]', 'standard', 'KACHI10');
  assert (q->>'discount')::numeric = 762.71, q::text;
  assert (q->>'tax')::numeric = 1235.59, q::text;      -- 6,864.41 × 18%
  assert (q->>'total')::numeric = 8100, q::text;       -- 8,100.00

  -- Promo minimum is checked against the GST-inclusive amount (₹9,000 < ₹50,000).
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1}]', 'standard', 'TESTMIN50K');
  assert q->>'promo_error' is not null and (q->>'discount')::numeric = 0, q::text;

  -- More than in stock is refused.
  begin
    perform public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":6}]', 'standard', null);
    assert false, 'over-stock quote should fail';
  exception when sqlstate 'P0001' then null;
  end;
end $$;

select 'pricing ok' as result;
rollback;
