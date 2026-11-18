-- Phase 0.3: stop exposing settings/media/uploads publicly and move secrets
-- into a table no client can read. Supersedes drizzle/migrations/0000_*.

-- site_settings: public may read only storefront keys; staff keep full access
-- via site_settings_staff_write (FOR ALL).
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('store', 'hero', 'social', 'why_us', 'shipping_settings', 'gst_settings'));

-- media_files: admin-only library; storefront uses the public file URLs.
DROP POLICY IF EXISTS media_files_public_read ON public.media_files;

-- gst_rates: public needs only the default rate and rates on active products.
DROP POLICY IF EXISTS gst_rates_public_read ON public.gst_rates;
CREATE POLICY gst_rates_public_read ON public.gst_rates
  FOR SELECT TO anon, authenticated
  USING (
    is_default
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.gst_rate_id = gst_rates.id AND p.status = 'active'
    )
  );

-- quote-uploads: no anonymous uploads (the public quote form doesn't upload).
DROP POLICY IF EXISTS public_insert_quote_uploads ON storage.objects;
DROP POLICY IF EXISTS staff_insert_quote_uploads ON storage.objects;
CREATE POLICY staff_insert_quote_uploads ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'quote-uploads'
    AND public.is_staff(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Secrets: RLS on with no policies => only service_role (edge functions) reads.
CREATE TABLE IF NOT EXISTS public.private_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.private_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_settings FROM anon, authenticated;

-- Write-only setter for admins. Object values are shallow-merged so saving one
-- secret doesn't wipe the others.
CREATE OR REPLACE FUNCTION public.admin_set_private_setting(_key text, _value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change secrets' USING ERRCODE = '42501';
  END IF;
  IF _key NOT IN ('smtp_password', 'payment_secrets') THEN
    RAISE EXCEPTION 'Unknown secret key: %', _key USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.private_settings AS ps (key, value, updated_by, updated_at)
  VALUES (_key, _value, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET
    value = CASE
      WHEN jsonb_typeof(ps.value) = 'object' AND jsonb_typeof(EXCLUDED.value) = 'object'
        THEN ps.value || EXCLUDED.value
      ELSE EXCLUDED.value
    END,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at;

  PERFORM public.admin_log('private_setting.set', 'private_settings', _key, '{}'::jsonb);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_private_setting(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_private_setting(text, jsonb) TO authenticated;

-- Move any secrets already saved in site_settings (none on prod as of 2026-11-18).
INSERT INTO public.private_settings (key, value)
SELECT 'smtp_password', value FROM public.site_settings WHERE key = 'smtp_password'
ON CONFLICT (key) DO NOTHING;
DELETE FROM public.site_settings WHERE key = 'smtp_password';
