-- Admin/staff access requires two-factor (TOTP). A staff member's own session
-- only counts as staff once it is aal2 (password + authenticator code), so a
-- stolen password alone can't reach admin data — enforced here, in every RLS
-- policy and RPC that goes through is_staff / has_role / has_permission.
-- Checks about OTHER users (auth.uid() differs, or service role) are unaffected.

CREATE OR REPLACE FUNCTION public.staff_mfa_ok(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT _user_id IS DISTINCT FROM auth.uid()
      OR coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
     AND (_role NOT IN ('admin', 'staff') OR public.staff_mfa_ok(_user_id));
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  ) AND public.staff_mfa_ok(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR (EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = _user_id AND permission = _perm)
          AND public.staff_mfa_ok(_user_id));
$$;

-- Admin login asks this right after the password step: true = this account is
-- staff and must complete (or set up) 2FA before it gets any admin access.
CREATE OR REPLACE FUNCTION public.staff_needs_mfa()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'staff'))
     AND coalesce(auth.jwt() ->> 'aal', '') <> 'aal2';
$$;
REVOKE EXECUTE ON FUNCTION public.staff_needs_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_needs_mfa() TO authenticated;

-- Admins can clear a staff member's authenticator (lost phone); they set it up
-- again at next login. Admins can't clear their own — use another admin.
CREATE OR REPLACE FUNCTION public.admin_reset_mfa(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') OR _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  DELETE FROM auth.mfa_factors WHERE user_id = _user_id;
  PERFORM public.admin_log('staff.mfa_reset', 'user', _user_id::text, '{}'::jsonb);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_reset_mfa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_mfa(uuid) TO authenticated;
