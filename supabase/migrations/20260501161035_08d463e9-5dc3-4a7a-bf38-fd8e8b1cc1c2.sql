-- Create media_files table
CREATE TABLE public.media_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'media',
  path TEXT NOT NULL,
  size_bytes BIGINT,
  content_type TEXT,
  alt_text TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_files_staff_all"
  ON public.media_files
  FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()))
  WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "media_files_public_read"
  ON public.media_files
  FOR SELECT
  TO public
  USING (true);

-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for media bucket
CREATE POLICY "media_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_staff_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND is_staff(auth.uid()));

CREATE POLICY "media_staff_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media' AND is_staff(auth.uid()));

CREATE POLICY "media_staff_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'media' AND is_staff(auth.uid()));