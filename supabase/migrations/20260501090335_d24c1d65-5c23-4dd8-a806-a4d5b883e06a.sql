
-- ==========================================================
-- 1.5  Performance indexes for admin search patterns
-- ==========================================================
CREATE INDEX IF NOT EXISTS products_name_lower_idx
  ON public.products USING btree (lower(name) text_pattern_ops);

CREATE INDEX IF NOT EXISTS products_sku_lower_idx
  ON public.products USING btree (lower(sku) text_pattern_ops);

CREATE INDEX IF NOT EXISTS orders_email_lower_idx
  ON public.orders USING btree (lower(customer_email));

CREATE INDEX IF NOT EXISTS orders_name_lower_idx
  ON public.orders USING btree (lower(customer_name));

CREATE INDEX IF NOT EXISTS orders_phone_idx
  ON public.orders USING btree (customer_phone);

CREATE INDEX IF NOT EXISTS activity_log_actor_idx
  ON public.activity_log USING btree (actor_id, created_at DESC);

-- Remove duplicate order_items index (idx_order_items_order duplicates order_items_order_idx)
DROP INDEX IF EXISTS public.idx_order_items_order;

-- Remove duplicate orders user_id index
DROP INDEX IF EXISTS public.idx_orders_user;


-- ==========================================================
-- 1.3  Dashboard summary RPC (consolidates ~10 queries into 1)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.admin_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _kpis jsonb;
  _monthly jsonb;
  _status jsonb;
  _top_products jsonb;
  _since_month timestamptz := now() - interval '30 days';
  _year_start timestamptz := date_trunc('year', now());
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- KPIs
  SELECT jsonb_build_object(
    'productCount',  (SELECT count(*) FROM products),
    'lowStock',      (SELECT count(*) FROM products WHERE stock < 5),
    'revenue',       COALESCE((SELECT sum(total) FROM orders WHERE created_at >= _since_month), 0),
    'ordersToday',   (SELECT count(*) FROM orders WHERE created_at >= date_trunc('day', now())),
    'quotesNew',     (SELECT count(*) FROM quote_requests WHERE status = 'new'),
    'callsNew',      (SELECT count(*) FROM callback_requests WHERE status = 'new'),
    'msgsNew',       (SELECT count(*) FROM contact_messages WHERE status = 'new')
  ) INTO _kpis;

  -- Monthly revenue + order count for current year
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.month_num), '[]'::jsonb)
  INTO _monthly
  FROM (
    SELECT
      extract(month FROM created_at)::int AS month_num,
      to_char(created_at, 'Mon') AS month,
      COALESCE(sum(total), 0) AS revenue,
      count(*) AS orders
    FROM orders
    WHERE created_at >= _year_start
    GROUP BY 1, 2
  ) t;

  -- Order status distribution
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', status::text, 'value', cnt) ORDER BY cnt DESC), '[]'::jsonb)
  INTO _status
  FROM (
    SELECT status, count(*) AS cnt FROM orders GROUP BY status
  ) s;

  -- Top 5 products by revenue
  SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY p.revenue DESC), '[]'::jsonb)
  INTO _top_products
  FROM (
    SELECT
      product_name AS name,
      product_sku AS sku,
      sum(qty) AS qty,
      sum(qty * unit_price) AS revenue
    FROM order_items
    GROUP BY product_name, product_sku
    ORDER BY revenue DESC
    LIMIT 5
  ) p;

  RETURN jsonb_build_object(
    'kpis', _kpis,
    'monthly', _monthly,
    'status', _status,
    'topProducts', _top_products
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_dashboard_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_summary() FROM public;


-- ==========================================================
-- 2.1  Lock down is_admin_email from anon/authenticated
--      (will be called only from edge function with service role)
-- ==========================================================
REVOKE EXECUTE ON FUNCTION public.is_admin_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_email(text) FROM public;


-- ==========================================================
-- 2.5  Strengthen admin_set_user_role
--      - Prevent orphaning the last admin
--      - Prevent staff from modifying other admins
-- ==========================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_is_admin boolean;
  _target_is_admin boolean;
  _admin_count int;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  _caller_is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  _target_is_admin := public.has_role(_user_id, 'admin'::app_role);

  -- Only admins can grant admin
  IF _role = 'admin'::app_role AND NOT _caller_is_admin THEN
    RAISE EXCEPTION 'only admins can grant admin role';
  END IF;

  -- Staff cannot modify other admins
  IF _target_is_admin AND NOT _caller_is_admin THEN
    RAISE EXCEPTION 'staff cannot modify admin accounts';
  END IF;

  -- Prevent orphaning the last admin
  IF _target_is_admin AND _role <> 'admin'::app_role THEN
    SELECT count(*) INTO _admin_count FROM public.user_roles WHERE role = 'admin'::app_role;
    IF _admin_count <= 1 THEN
      RAISE EXCEPTION 'cannot remove the last admin';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
  PERFORM public.admin_log('user.role_change', 'user', _user_id::text, jsonb_build_object('role', _role::text));
END;
$$;


-- ==========================================================
-- 2.3  Restrict admin_profiles self-update to safe columns
-- ==========================================================
CREATE OR REPLACE FUNCTION public.tg_admin_profiles_restrict_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT an admin, only allow safe column changes
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.email := OLD.email;
    NEW.is_active := OLD.is_active;
    NEW.id := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_admin_profiles_restrict_self_update
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_admin_profiles_restrict_self_update();


-- ==========================================================
-- 3.3  Automatic audit triggers for key tables
-- ==========================================================
CREATE OR REPLACE FUNCTION public.tg_audit_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action text;
  _entity_id text;
  _diff jsonb;
  _actor uuid;
  _email text;
BEGIN
  _actor := auth.uid();
  IF _actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _actor;

  _action := lower(TG_TABLE_NAME) || '.' || lower(TG_OP);

  IF TG_OP = 'DELETE' THEN
    _entity_id := OLD.id::text;
    _diff := to_jsonb(OLD);
  ELSIF TG_OP = 'INSERT' THEN
    _entity_id := NEW.id::text;
    _diff := to_jsonb(NEW);
  ELSE
    _entity_id := NEW.id::text;
    -- Only store changed fields
    _diff := (
      SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
      FROM jsonb_each(to_jsonb(NEW))
      WHERE to_jsonb(NEW) -> key IS DISTINCT FROM to_jsonb(OLD) -> key
    );
  END IF;

  INSERT INTO public.activity_log (actor_id, actor_email, action, entity_type, entity_id, diff)
  VALUES (_actor, _email, _action, TG_TABLE_NAME, _entity_id, _diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Products
CREATE TRIGGER tg_audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_row();

-- Orders
CREATE TRIGGER tg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_row();

-- Categories
CREATE TRIGGER tg_audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_row();

-- Battery Brands
CREATE TRIGGER tg_audit_battery_brands
  AFTER INSERT OR UPDATE OR DELETE ON public.battery_brands
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_row();

-- Site Settings (uses 'key' column instead of 'id')
CREATE OR REPLACE FUNCTION public.tg_audit_site_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid;
  _email text;
  _diff jsonb;
BEGIN
  _actor := auth.uid();
  IF _actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _actor;

  IF TG_OP = 'UPDATE' THEN
    _diff := jsonb_build_object('old_value', OLD.value, 'new_value', NEW.value);
  ELSE
    _diff := to_jsonb(COALESCE(NEW, OLD));
  END IF;

  INSERT INTO public.activity_log (actor_id, actor_email, action, entity_type, entity_id, diff)
  VALUES (_actor, _email, 'site_settings.' || lower(TG_OP), 'site_settings', COALESCE(NEW.key, OLD.key), _diff);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_audit_site_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_site_settings();
