-- Payment state can only change server-side, once. Rolls back; safe on prod.
-- Run: supabase db query --linked -f supabase/tests/payment_authz_check.sql
begin;
create temp table t on commit drop as
  select (select user_id from public.user_roles where role = 'customer' limit 1) uid, 'TEST-PAYCHECK-1'::text num;
insert into public.orders (user_id, order_number, status, payment_status, payment_method, subtotal, tax, total)
  select uid, num, 'pending', 'unpaid', 'Online (Cashfree)', 100, 18, 118 from t;
do $$ begin
  -- Wrong amount is flagged, never marked paid.
  assert public.mark_order_paid('TEST-PAYCHECK-1', 'cf_1', 1) = 'amount_mismatch', 'mismatch not flagged';
  assert (select payment_status from orders where order_number = 'TEST-PAYCHECK-1') = 'unpaid', 'mismatch marked paid';
  -- Duplicate webhooks: one paid transition.
  assert public.mark_order_paid('TEST-PAYCHECK-1', 'cf_1', 118) = 'paid', 'first webhook';
  assert public.mark_order_paid('TEST-PAYCHECK-1', 'cf_1', 118) = 'already_paid', 'duplicate webhook';
  -- Browser roles can't call the server-only function.
  assert not has_function_privilege('authenticated', 'public.mark_order_paid(text,text,numeric)', 'EXECUTE'), 'customers can mark paid';
  assert not has_function_privilege('anon', 'public.mark_order_paid(text,text,numeric)', 'EXECUTE'), 'anon can mark paid';
  update orders set payment_status = 'unpaid' where order_number = 'TEST-PAYCHECK-1';
end $$;
grant select on t to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true) from t;
do $$ declare n int; begin
  -- The owner sees the order but cannot change totals or payment status.
  assert (select count(*) from orders where order_number = 'TEST-PAYCHECK-1') = 1, 'owner cannot see own order';
  update orders set total = 1, payment_status = 'paid' where order_number = 'TEST-PAYCHECK-1';
  get diagnostics n = row_count;
  assert n = 0, 'customer changed their order';
end $$;
select 'payment_authz_check passed' as result;
rollback;
