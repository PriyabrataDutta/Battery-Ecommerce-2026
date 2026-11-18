DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key IN ('store', 'hero', 'social', 'why_us', 'shipping_settings', 'gst_settings'));

DROP POLICY IF EXISTS media_files_public_read ON public.media_files;

DROP POLICY IF EXISTS gst_rates_public_read ON public.gst_rates;
CREATE POLICY gst_rates_public_read ON public.gst_rates
  FOR SELECT TO anon, authenticated
  USING (
    is_default
    OR EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.gst_rate_id = gst_rates.id
        AND p.status = 'active'
    )
  );

DROP POLICY IF EXISTS public_insert_quote_uploads ON storage.objects;
CREATE POLICY staff_insert_quote_uploads ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'quote-uploads'
    AND public.is_staff(auth.uid())
    AND (storage.foldername(name))[1] = auth.uid()::text
  );