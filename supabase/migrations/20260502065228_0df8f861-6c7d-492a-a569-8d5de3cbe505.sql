
-- Create review status type
DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Product reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  status review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON public.product_reviews (product_id);
CREATE INDEX idx_reviews_user ON public.product_reviews (user_id);
CREATE INDEX idx_reviews_status ON public.product_reviews (status);

-- Trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "reviews_public_read" ON public.product_reviews
  FOR SELECT TO public
  USING (status = 'approved' OR is_staff(auth.uid()));

-- Authenticated users can create their own reviews
CREATE POLICY "reviews_self_insert" ON public.product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending reviews
CREATE POLICY "reviews_self_update" ON public.product_reviews
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own pending reviews
CREATE POLICY "reviews_self_delete" ON public.product_reviews
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Staff can manage all reviews
CREATE POLICY "reviews_staff_all" ON public.product_reviews
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Review images table
CREATE TABLE public.review_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_images_review ON public.review_images (review_id);

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Public can read images of approved reviews
CREATE POLICY "review_images_public_read" ON public.review_images
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_images.review_id
    AND (r.status = 'approved' OR is_staff(auth.uid()))
  ));

-- Users can insert images for their own reviews
CREATE POLICY "review_images_self_insert" ON public.review_images
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_images.review_id
    AND r.user_id = auth.uid()
  ));

-- Users can delete images from their own pending reviews
CREATE POLICY "review_images_self_delete" ON public.review_images
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.product_reviews r
    WHERE r.id = review_images.review_id
    AND r.user_id = auth.uid()
    AND r.status = 'pending'
  ));

-- Staff can manage all review images
CREATE POLICY "review_images_staff_all" ON public.review_images
  FOR ALL TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

-- Storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view review images
CREATE POLICY "review_images_bucket_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'review-images');

-- Authenticated users can upload review images
CREATE POLICY "review_images_bucket_auth_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images');
