
-- Create GST rates table
CREATE TABLE public.gst_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  rate numeric NOT NULL DEFAULT 18,
  hsn_code text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gst_rates ENABLE ROW LEVEL SECURITY;

-- Public read (needed at storefront/checkout)
CREATE POLICY "gst_rates_public_read" ON public.gst_rates
  FOR SELECT TO public USING (true);

-- Staff write
CREATE POLICY "gst_rates_staff_write" ON public.gst_rates
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Trigger: enforce single default
CREATE OR REPLACE FUNCTION public.enforce_single_default_gst_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.gst_rates SET is_default = false WHERE id <> NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_single_default_gst
  BEFORE INSERT OR UPDATE ON public.gst_rates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_gst_rate();

-- Updated_at trigger
CREATE TRIGGER set_gst_rates_updated_at
  BEFORE UPDATE ON public.gst_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed standard Indian GST slabs
INSERT INTO public.gst_rates (label, rate, is_default) VALUES
  ('GST 0%', 0, false),
  ('GST 5%', 5, false),
  ('GST 12%', 12, false),
  ('GST 18%', 18, true),
  ('GST 28%', 28, false);

-- Add gst_rate_id to products
ALTER TABLE public.products ADD COLUMN gst_rate_id uuid REFERENCES public.gst_rates(id);
