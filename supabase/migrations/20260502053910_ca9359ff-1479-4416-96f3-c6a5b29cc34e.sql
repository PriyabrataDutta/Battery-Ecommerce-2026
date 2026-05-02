
-- ============================================================
-- 1. staff_permissions table
-- ============================================================
CREATE TABLE public.staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "staff_permissions_admin_all"
  ON public.staff_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Staff can read their own permissions
CREATE POLICY "staff_permissions_self_read"
  ON public.staff_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2. has_permission() — security definer function
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.staff_permissions
      WHERE user_id = _user_id
        AND permission = _perm
    )
$$;

-- ============================================================
-- 3. admin_list_customers() — returns customer-role users only
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_customers()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  phone text,
  company text,
  phone_verified boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.company,
    p.phone_verified,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE public.is_staff(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.user_roles r
      WHERE r.user_id = p.id AND r.role = 'customer'
    )
  ORDER BY p.created_at DESC;
$$;
