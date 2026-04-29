import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types/catalog";

const CategoryPage = () => {
  const { slug } = useParams();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["category_products", slug],
    enabled: !!category,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*)")
        .eq("category_id", category!.id)
        .eq("status", "active");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-ink">{category?.name ?? slug}</span>
      </nav>
      <h1 className="font-display-tight text-4xl font-bold">{category?.name ?? slug}</h1>
      {category?.description && <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

export default CategoryPage;
