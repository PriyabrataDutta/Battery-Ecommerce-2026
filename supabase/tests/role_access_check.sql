-- Role access matrix: guest, customer, staff (reviews only) with/without 2FA, admin with/without 2FA
-- try 20 sensitive actions. Every action is undone; the whole run is rolled back. Safe on prod.
-- Run: psql "$POOLER_URL" -q -At -F ' ' -f supabase/tests/role_access_check.sql
-- Read 'ALLOWED n rows' with n > 0 as real access; 'ALLOWED 0 rows' means RLS filtered everything.
begin;
create temp table ctx as select
  (select user_id from public.user_roles where role = 'admin' limit 1) admin_id,
  (select user_id from public.user_roles where role = 'customer' order by user_id limit 1) cust_a,
  (select user_id from public.user_roles where role = 'customer' order by user_id desc limit 1) cust_b,
  gen_random_uuid() staff_id;
-- Throwaway staff user with ONLY reviews.manage (rolled back).
insert into auth.users (id, email, aud, role) select staff_id, 'role-check@invalid.invalid', 'authenticated', 'authenticated' from ctx;
insert into public.user_roles (user_id, role) select staff_id, 'staff' from ctx;
insert into public.staff_permissions (user_id, permission) select staff_id, 'reviews.manage' from ctx;
create temp table res (who text, test text, result text);
grant all on res to anon, authenticated;
grant select on ctx to anon, authenticated;

create temp table cases (n int, test text, sql text);
insert into cases values
 (1,  'read all orders',                 'select count(*) from public.orders'),
 (2,  'change any order total',          'update public.orders set total = 1'),
 (3,  'mark orders paid',                'update public.orders set payment_status = ''paid'''),
 (4,  'change product prices',           'update public.products set price = 1'),
 (5,  'create 100% promo offer',         'insert into public.offers (code, title, type, value, applies_to, min_order_total) select ''HACK100'',''x'', type, 100, applies_to, 0 from public.offers limit 1'),
 (6,  'read other customers profiles',   'select count(*) from public.profiles'),
 (7,  'read all addresses',              'select count(*) from public.customer_addresses'),
 (8,  'self-set phone_verified',         'update public.profiles set phone_verified = true where id = auth.uid()'),
 (9,  'grant self admin role',           'insert into public.user_roles (user_id, role) values (auth.uid(), ''admin'')'),
 (10, 'admin_set_user_role self admin',  'select public.admin_set_user_role(auth.uid(), ''admin'')'),
 (11, 'admin_list_customers()',          'select count(*) from public.admin_list_customers()'),
 (12, 'read private_settings',           'select count(*) from public.private_settings'),
 (13, 'change site settings',            'update public.site_settings set value = value'),
 (14, 'delete audit log',                'delete from public.activity_log'),
 (15, 'read staff permissions (all)',    'select count(*) from public.staff_permissions'),
 (16, 'return request on other''s order','insert into public.return_requests (order_id, user_id, reason) select o.id, auth.uid(), ''x'' from public.orders o where o.user_id is distinct from auth.uid() limit 1'),
 (17, 'read phone codes',                'select count(*) from public.phone_verification_codes'),
 (18, 'read contact messages',           'select count(*) from public.contact_messages'),
 (19, 'delete products',                 'delete from public.products'),
 (20, 'admin_reset_mfa(admin)',          'select public.admin_reset_mfa((select admin_id from ctx))');

create or replace function pg_temp.run(who text, r text, sub uuid, aal text) returns void language plpgsql as $f$
declare c record; n bigint; v text;
begin
  for c in select * from cases order by n loop
    begin
      execute format('set local role %I', r);
      perform set_config('request.jwt.claims', json_build_object('sub', sub, 'role', r, 'aal', aal)::text, true);
      if c.sql ~* '^\s*select' then execute 'select (' || c.sql || ' limit 1)::text' into v; v := coalesce(v, 'null');
      else execute c.sql; get diagnostics n = row_count; v := n || ' rows'; end if;
      raise exception 'UNDO:%', v;  -- always undo this test's effects
    exception when others then
      execute 'reset role';
      insert into res values (who, c.n || '. ' || c.test,
        case when sqlerrm like 'UNDO:%' then 'ALLOWED ' || substr(sqlerrm, 6) else 'denied (' || left(sqlerrm, 45) || ')' end);
    end;
  end loop;
end $f$;

select pg_temp.run('guest',            'anon',          null,                               'aal1');
select pg_temp.run('customer',         'authenticated', (select cust_a from ctx),           'aal1');
select pg_temp.run('staff(reviews) 2FA','authenticated',(select staff_id from ctx),         'aal2');
select pg_temp.run('staff no-2FA',     'authenticated', (select staff_id from ctx),         'aal1');
select pg_temp.run('admin 2FA',        'authenticated', (select admin_id from ctx),         'aal2');
select pg_temp.run('admin no-2FA',     'authenticated', (select admin_id from ctx),         'aal1');

select test, string_agg(who || '=' || result, '  ||  ' order by who) from res group by test order by split_part(test, '.', 1)::int;
rollback;
