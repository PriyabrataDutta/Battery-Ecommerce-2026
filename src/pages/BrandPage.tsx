import { useParams, Link } from "react-router-dom";
import { ProductCard } from "@/components/products/ProductCard";
import { useBatteryBrandBySlug } from "@/hooks/queries/useBrands";
import { useProducts } from "@/hooks/queries/useProducts";

const BrandPage = () => {
  const { slug } = useParams();

  const { data: brand } = useBatteryBrandBySlug(slug);
  const { data: products = [] } = useProducts(brand ? { brandId: brand.id } : undefined);

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/brands" className="hover:text-primary">Brands</Link> / <span className="text-ink">{brand?.name ?? slug}</span>
      </nav>
      <h1 className="font-display-tight text-4xl font-bold">{brand?.name ?? slug}</h1>
      {brand?.description && <p className="text-muted-foreground mt-2 max-w-2xl">{brand.description}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

export default BrandPage;
