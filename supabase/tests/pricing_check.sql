-- Self-checking test for _price_order / place_order. Leaves nothing behind.
-- Run: supabase db query --linked -f supabase/tests/pricing_check.sql
-- Success = final row says 'pricing ok'; any failed assert raises an error.
begin;

insert into products (id, name, slug, sku, price, price_with_exchange, price_without_exchange,
                      has_exchange, stock, status)
values ('00000000-0000-0000-0000-00000000c0de', 'Pricing Test Battery', 'pricing-test-battery',
        'PRICING-TEST', 11800, 10000, 11800, true, 5, 'active');
insert into offers (title, code, type, value, min_order_total, is_active)
values ('Test high minimum', 'TESTMIN50K', 'flat', 100, 50000, true);

do $$
declare q jsonb;
begin
  -- No promo, no exchange: GST is inside the price (11800 × 18/118 = 1800).
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1}]', 'standard', null);
  assert (q->>'subtotal')::numeric = 11800, q::text;
  assert (q->>'tax')::numeric = 1800, q::text;
  assert (q->>'total')::numeric = 11800, q::text;

  -- Exchange price + express shipping (shipping added, not taxed).
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":2,"with_exchange":true}]', 'express', null);
  assert (q->>'subtotal')::numeric = 20000, q::text;
  assert (q->>'total')::numeric = 20000 + (q->>'shipping')::numeric, q::text;

  -- 10% promo: discount off subtotal, GST from the discounted amount.
  q := public._price_order('[{"product_id":"00000000-0000-0000-0000-00000000c0de","qty":1}]', 'standard', 'KACHI10');
  assert (q->>'discount')::numeric = 1180, q::text;
  assert (q->>'tax')::numeric = 1620, q::text;   -- 10620 × 18/118
  assert (q->>'total')::numeric = 10620, q::text;

  -- Promo below its minimum is refused.
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
