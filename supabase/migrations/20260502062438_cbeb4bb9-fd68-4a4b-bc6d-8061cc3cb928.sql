
-- Revoke from PUBLIC (the catch-all role that grants to everyone by default)
-- Trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_address() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_gst_rate() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_admin_profiles_restrict_self_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_audit_row() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_audit_site_settings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;

-- Admin functions
REVOKE EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_customers() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_order_status_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_storage_usage() FROM PUBLIC;

-- Internal helpers
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_phone_code(text) FROM PUBLIC;

-- Now re-grant to authenticated where needed (admin + RPC functions)
GRANT EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_customers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_order_status_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_storage_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_phone_code(text) TO authenticated;

-- Functions that need anon access (pre-login flows + RLS helpers)
-- is_admin_email: called before sign-in to check admin emails
GRANT EXECUTE ON FUNCTION public.is_admin_email(text) TO anon;
-- lookup_email_by_phone: phone-based login flow
GRANT EXECUTE ON FUNCTION public.lookup_email_by_phone(text) TO anon;
-- is_staff + has_role: used in RLS policies that evaluate for public SELECT
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
