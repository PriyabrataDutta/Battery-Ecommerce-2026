
-- ═══════════════════════════════════════════════════════════════
-- 1. TRIGGER-ONLY FUNCTIONS: revoke EXECUTE from anon + authenticated
--    Triggers run as the table owner, so this doesn't break anything.
-- ═══════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_address() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_gst_rate() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_admin_profiles_restrict_self_update() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_audit_row() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_audit_site_settings() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 2. ADMIN FUNCTIONS: revoke EXECUTE from anon
--    Each function already has an internal is_staff / has_role guard,
--    but revoking anon execute means unauthenticated callers can't
--    even reach the guard.
-- ═══════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_customers() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_order_status_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_storage_usage() FROM anon;

-- ═══════════════════════════════════════════════════════════════
-- 3. INTERNAL HELPER: has_permission — not used via RPC
-- ═══════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;

-- ═══════════════════════════════════════════════════════════════
-- 4. verify_phone_code — must be signed in to use
-- ═══════════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.verify_phone_code(text) FROM anon;

-- ═══════════════════════════════════════════════════════════════
-- 5. TIGHTEN PUBLIC INSERT POLICIES
--    Replace WITH CHECK (true) with basic field validation so bots
--    can't insert empty rows.
-- ═══════════════════════════════════════════════════════════════

-- callback_requests
DROP POLICY IF EXISTS cb_public_insert ON public.callback_requests;
CREATE POLICY "cb_public_insert" ON public.callback_requests
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(phone)) >= 10
  );

-- contact_messages
DROP POLICY IF EXISTS contact_public_insert ON public.contact_messages;
CREATE POLICY "contact_public_insert" ON public.contact_messages
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 5
    AND length(trim(message)) > 0
  );

-- quote_requests
DROP POLICY IF EXISTS quote_public_insert ON public.quote_requests;
CREATE POLICY "quote_public_insert" ON public.quote_requests
  FOR INSERT TO public
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 5
    AND length(trim(phone)) >= 10
    AND length(trim(requirement)) > 0
  );
