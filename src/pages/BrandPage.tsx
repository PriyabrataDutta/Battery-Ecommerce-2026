import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/catalog";

const BrandPage = () => {
  const { slug } = useParams();

  const { data: brand } = useQuery({
    queryKey: ["brand", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("battery_brands").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["brand_products", slug],
    enabled: !!brand,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*)")
        .eq("brand_id", brand!.id)
        .eq("status", "active");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

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
