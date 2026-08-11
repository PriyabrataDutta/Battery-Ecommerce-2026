-- 1. Prevent customers from self-approving reviews
DROP POLICY IF EXISTS "reviews_self_update" ON public.product_reviews;
CREATE POLICY "reviews_self_update"
ON public.product_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'pending'::review_status)
WITH CHECK (user_id = auth.uid() AND status = 'pending'::review_status);

DROP POLICY IF EXISTS "reviews_self_insert" ON public.product_reviews;
CREATE POLICY "reviews_self_insert"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending'::review_status);

-- 2. Split public-read policies so anon does not need is_staff()
DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_anon_read" ON public.products FOR SELECT TO anon
USING (status = 'active');
CREATE POLICY "products_auth_read" ON public.products FOR SELECT TO authenticated
USING (status = 'active' OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
CREATE POLICY "blog_anon_read" ON public.blog_posts FOR SELECT TO anon
USING (is_published = true);
CREATE POLICY "blog_auth_read" ON public.blog_posts FOR SELECT TO authenticated
USING (is_published = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_anon_read" ON public.product_reviews FOR SELECT TO anon
USING (status = 'approved'::review_status);
CREATE POLICY "reviews_auth_read" ON public.product_reviews FOR SELECT TO authenticated
USING (status = 'approved'::review_status OR user_id = auth.uid() OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "review_images_public_read" ON public.review_images;
CREATE POLICY "review_images_anon_read" ON public.review_images FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.product_reviews r
  WHERE r.id = review_images.review_id AND r.status = 'approved'::review_status
));
CREATE POLICY "review_images_auth_read" ON public.review_images FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.product_reviews r
  WHERE r.id = review_images.review_id
    AND (r.status = 'approved'::review_status OR r.user_id = auth.uid() OR public.is_staff(auth.uid()))
));

-- 3. Revoke unnecessary EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_admin_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lookup_email_by_phone(text) FROM PUBLIC, anon, authenticated;
