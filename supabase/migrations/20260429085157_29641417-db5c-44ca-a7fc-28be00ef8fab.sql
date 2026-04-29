
-- Staff can read/write/update/delete files in the four content buckets
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['product-images','brand-logos','catalogs','blog']
  LOOP
    EXECUTE format($f$
      DROP POLICY IF EXISTS "staff_write_%s" ON storage.objects;
      CREATE POLICY "staff_write_%s" ON storage.objects
        FOR ALL TO authenticated
        USING (bucket_id = %L AND public.is_staff(auth.uid()))
        WITH CHECK (bucket_id = %L AND public.is_staff(auth.uid()));
    $f$, b, b, b, b);
  END LOOP;
END $$;
