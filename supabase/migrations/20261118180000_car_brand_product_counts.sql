-- Shop filter: distinct active products per car brand, counted in the DB
-- (the old client-side version read product_fitment and hit the 1000-row cap).
CREATE OR REPLACE FUNCTION public.car_brand_product_counts(in_stock_only boolean DEFAULT true)
RETURNS TABLE (slug text, product_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT cb.slug, count(DISTINCT p.id)
    FROM product_fitment f
    JOIN car_models cm ON cm.id = f.car_model_id
    JOIN car_brands cb ON cb.id = cm.car_brand_id
    JOIN products p ON p.id = f.product_id
   WHERE p.status = 'active' AND (NOT in_stock_only OR p.stock > 0)
   GROUP BY cb.slug
$$;
GRANT EXECUTE ON FUNCTION public.car_brand_product_counts(boolean) TO anon, authenticated;
