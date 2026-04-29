CREATE OR REPLACE FUNCTION public.admin_order_status_counts()
RETURNS TABLE(status text, value bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.status::text AS status, COUNT(*)::bigint AS value
  FROM public.orders o
  WHERE public.is_staff(auth.uid())
  GROUP BY o.status
  ORDER BY value DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_order_status_counts() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_order_status_counts() TO authenticated;