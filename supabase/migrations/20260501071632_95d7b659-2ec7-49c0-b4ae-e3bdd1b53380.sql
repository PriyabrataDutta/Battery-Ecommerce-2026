-- Revoke EXECUTE from anon on internal/admin functions that should never be callable by signed-out visitors.
-- Functions kept anon-callable (intentional, used by unauthenticated flows):
--   is_admin_email, lookup_email_by_phone, verify_phone_code
REVOKE EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enforce_single_default_address() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;

-- Re-grant to authenticated where the app needs it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_admin_profile(text, text, text, app_role) TO authenticated;
-- enforce_single_default_address and handle_new_user are trigger functions; they don't need EXECUTE granted.