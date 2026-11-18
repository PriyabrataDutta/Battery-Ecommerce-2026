-- Indexes for lookups that currently scan whole tables.
-- Shop "batteries for this car": product_fitment filtered by car_model_id
-- (the primary key starts with product_id, so it can't serve this).
CREATE INDEX IF NOT EXISTS product_fitment_car_model_id_idx ON public.product_fitment (car_model_id);
-- gst_rates public-read policy checks products by gst_rate_id for every rate.
CREATE INDEX IF NOT EXISTS products_gst_rate_id_idx ON public.products (gst_rate_id);
-- Product deletes (ON DELETE SET NULL) and per-product sales lookups.
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items (product_id);
