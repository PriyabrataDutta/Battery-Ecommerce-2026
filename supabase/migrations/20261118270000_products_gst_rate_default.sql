-- Every product carries an explicit GST rate from Admin → Settings → GST.
-- Existing products without one get the default rate (18% today); new
-- products get the default automatically unless the editor picks another.
UPDATE public.products
   SET gst_rate_id = (SELECT id FROM public.gst_rates WHERE is_default LIMIT 1)
 WHERE gst_rate_id IS NULL;

CREATE OR REPLACE FUNCTION public.tg_products_default_gst()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.gst_rate_id IS NULL THEN
    NEW.gst_rate_id := (SELECT id FROM gst_rates WHERE is_default LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_products_default_gst ON public.products;
CREATE TRIGGER trg_products_default_gst
  BEFORE INSERT OR UPDATE OF gst_rate_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_products_default_gst();
