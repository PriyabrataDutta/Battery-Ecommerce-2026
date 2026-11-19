-- Staff 2FA gate: an admin's own password-only (aal1) session must not count as
-- staff; the same session after 2FA (aal2) must. Rolls back; safe on prod.
-- Run: supabase db query --linked -f supabase/tests/mfa_check.sql
begin;
create temp table r on commit drop as select (select user_id from public.user_roles where role = 'admin' limit 1) uid;
grant select on r to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'aal', 'aal1')::text, true) from r;
do $$ begin
  assert not public.is_staff((select uid from r)), 'aal1 admin counted as staff';
  assert not public.has_permission((select uid from r), 'system.view'), 'aal1 admin has permission';
  assert public.staff_needs_mfa(), 'aal1 admin not asked for 2FA';
end $$;
select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated', 'aal', 'aal2')::text, true) from r;
do $$ begin
  assert public.is_staff((select uid from r)), 'aal2 admin not staff';
  assert not public.staff_needs_mfa(), 'aal2 admin still asked for 2FA';
end $$;
select 'mfa_check passed' as result;
rollback;
