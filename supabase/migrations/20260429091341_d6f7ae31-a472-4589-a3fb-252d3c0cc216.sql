-- =========================
-- 1. offers
-- =========================
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  type text NOT NULL CHECK (type IN ('percent','flat')),
  value numeric NOT NULL CHECK (value >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  applies_to jsonb NOT NULL DEFAULT '{}'::jsonb,
  min_order_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_public_read ON public.offers
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY offers_staff_read_all ON public.offers
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY offers_staff_write ON public.offers
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER offers_set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS offers_active_idx ON public.offers (is_active, ends_at);

-- =========================
-- 2. site_settings
-- =========================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY site_settings_staff_write ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed defaults
INSERT INTO public.site_settings (key, value) VALUES
  ('store', '{"name":"Kachi Batteries","tagline":"Power You Can Trust","phone":"+91 00000 00000","whatsapp":"+91 00000 00000","email":"hello@kachi.in","address":"India","gst":"","footer_note":""}'::jsonb),
  ('hero', '{"headline":"India''s Most Trusted Battery Store","subhead":"Genuine Amaron, Exide, Power Zone & Elito batteries with doorstep delivery and free old battery exchange.","cta_label":"Shop Batteries","cta_link":"/shop"}'::jsonb),
  ('social', '{"facebook":"","instagram":"","youtube":"","linkedin":""}'::jsonb),
  ('why_us', '{"items":[{"title":"100% Genuine","desc":"Direct from authorized distributors."},{"title":"Free Exchange","desc":"Save up to ₹1500 on your old battery."},{"title":"Free Doorstep Fitment","desc":"Within city limits, same-day."},{"title":"Manufacturer Warranty","desc":"Full brand warranty, hassle-free claims."}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =========================
-- 3. activity_log
-- =========================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  diff jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_log_staff_read ON public.activity_log
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Writes happen exclusively through admin_log() RPC; no direct insert policy.

CREATE INDEX IF NOT EXISTS activity_log_created_idx ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON public.activity_log (entity_type, entity_id);

-- =========================
-- 4. RPCs
-- =========================

-- admin_log: insert audit row for caller
CREATE OR REPLACE FUNCTION public.admin_log(
  _action text,
  _entity_type text,
  _entity_id text DEFAULT NULL,
  _diff jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.activity_log (actor_id, actor_email, action, entity_type, entity_id, diff)
  VALUES (auth.uid(), _email, _action, _entity_type, _entity_id, COALESCE(_diff, '{}'::jsonb));
END $$;

REVOKE ALL ON FUNCTION public.admin_log(text, text, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) TO authenticated;

-- admin_list_users: profiles + roles + email
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  company text,
  roles text[],
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
    COALESCE(
      (SELECT array_agg(r.role::text ORDER BY r.role::text)
       FROM public.user_roles r WHERE r.user_id = p.id),
      ARRAY[]::text[]
    ) AS roles,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE public.is_staff(auth.uid())
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- admin_set_user_role: replace caller's roles for a given user
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _user_id uuid,
  _role app_role
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- Only admins can grant admin
  IF _role = 'admin'::app_role AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'only admins can grant admin role';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
  PERFORM public.admin_log('user.role_change', 'user', _user_id::text, jsonb_build_object('role', _role::text));
END $$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;

-- admin_storage_usage: bytes per bucket
CREATE OR REPLACE FUNCTION public.admin_storage_usage()
RETURNS TABLE (bucket_id text, file_count bigint, total_bytes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.bucket_id::text,
    COUNT(*)::bigint AS file_count,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes
  FROM storage.objects o
  WHERE public.is_staff(auth.uid())
  GROUP BY o.bucket_id
  ORDER BY total_bytes DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_storage_usage() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_storage_usage() TO authenticated;

-- =========================
-- 5. Hot indexes for admin filters
-- =========================
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON public.quote_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS callback_requests_status_idx ON public.callback_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON public.contact_messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS products_status_stock_idx ON public.products (status, stock);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS product_fitment_model_idx ON public.product_fitment (car_model_id);
CREATE INDEX IF NOT EXISTS product_fitment_product_idx ON public.product_fitment (product_id);