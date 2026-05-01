
-- Revoke EXECUTE from anon on SECURITY DEFINER functions that should not be publicly callable
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_storage_usage() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_order_status_counts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_address() FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_email_by_phone(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_phone_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tg_audit_row() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tg_audit_site_settings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.tg_admin_profiles_restrict_self_update() FROM anon;

-- Also revoke from public to be thorough
REVOKE EXECUTE ON FUNCTION public.admin_log(text, text, text, jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(uuid, app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_storage_usage() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_order_status_counts() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.tg_audit_row() FROM public;
REVOKE EXECUTE ON FUNCTION public.tg_audit_site_settings() FROM public;
REVOKE EXECUTE ON FUNCTION public.tg_admin_profiles_restrict_self_update() FROM public;
