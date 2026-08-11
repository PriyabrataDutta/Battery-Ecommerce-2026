-- 1. Public buckets: remove broad listing policies (direct public URLs still work)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "public_read_blog" ON storage.objects;
DROP POLICY IF EXISTS "public_read_brand_logos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_catalogs" ON storage.objects;
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
DROP POLICY IF EXISTS "review_images_bucket_public_read" ON storage.objects;

-- 2. return-images: owner-scoped (first folder = user id) or staff
DROP POLICY IF EXISTS "return_images_bucket_auth_read" ON storage.objects;
CREATE POLICY "return_images_owner_or_staff_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'return-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_staff(auth.uid())
  )
);

DROP POLICY IF EXISTS "return_images_bucket_auth_upload" ON storage.objects;
CREATE POLICY "return_images_owner_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'return-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. review-images: uploads only into own folder
DROP POLICY IF EXISTS "review_images_bucket_auth_upload" ON storage.objects;
CREATE POLICY "review_images_owner_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Revoke unnecessary EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.notify_return_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lookup_email_by_phone(text) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
