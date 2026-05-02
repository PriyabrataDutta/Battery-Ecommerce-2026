
CREATE TABLE public.permission_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  description text,
  keys text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.permission_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presets_admin_all" ON public.permission_presets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "presets_staff_read" ON public.permission_presets
  FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE TRIGGER update_permission_presets_updated_at
  BEFORE UPDATE ON public.permission_presets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
