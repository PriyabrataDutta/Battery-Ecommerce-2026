import { useParams, Navigate, useSearchParams } from "react-router-dom";

/**
 * CategoryPage now redirects to /shop?type=<slug> so all the rich shop
 * features (filters, sort, view toggle, active filters, price slider)
 * are available on category pages too.
 */
const CategoryPage = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();

  const next = new URLSearchParams(params);
  if (slug) next.set("type", slug);

  return <Navigate to={`/shop?${next.toString()}`} replace />;
};

export default CategoryPage;
