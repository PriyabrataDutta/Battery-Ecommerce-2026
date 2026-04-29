import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { FitmentSearch } from "@/components/products/FitmentSearch";
import type { Product } from "@/types/catalog";

const CategoryPage = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const brandSlug = params.get("battery_brand");
  const carModelSlug = params.get("car_model");

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["category_products", slug, brandSlug],
    enabled: !!category,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, battery_brands(*)")
        .eq("category_id", category!.id)
        .eq("status", "active");
      if (error) throw error;
      let list = data as unknown as Product[];
      if (brandSlug) list = list.filter((p) => p.battery_brands?.slug === brandSlug);
      return list;
    },
  });

  const { data: fitmentProductIds } = useQuery({
    queryKey: ["fitment_ids", carModelSlug],
    enabled: !!carModelSlug,
    queryFn: async (): Promise<string[]> => {
      const { data: model } = await supabase.from("car_models").select("id").eq("slug", carModelSlug!).maybeSingle();
      if (!model) return [];
      const { data } = await supabase.from("product_fitment").select("product_id").eq("car_model_id", model.id);
      return (data ?? []).map((r) => r.product_id);
    },
  });

  const filtered = useMemo(() => {
    if (!carModelSlug) return products;
    if (!fitmentProductIds) return products;
    return products.filter((p) => fitmentProductIds.includes(p.id));
  }, [products, carModelSlug, fitmentProductIds]);

  const { data: brands = [] } = useQuery({
    queryKey: ["battery_brands_list"],
    queryFn: async () => {
      const { data } = await supabase.from("battery_brands").select("name, slug").order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-ink">{category?.name ?? slug}</span>
      </nav>
      <h1 className="font-display-tight text-4xl font-bold">{category?.name ?? slug}</h1>
      {category?.description && <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>}
      <p className="text-muted-foreground mt-1 text-sm">{filtered.length} products</p>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8 mt-8">
        <aside className="space-y-6">
          <div className="bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Find by Vehicle</h3>
            <FitmentSearch embedded />
          </div>
          <div className="bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Battery Brand</h3>
            <ul className="space-y-2 text-sm">
              {(brands.length ? brands : [
                { name: "Amaron", slug: "amaron" },
                { name: "Exide", slug: "exide" },
                { name: "Power Zone", slug: "power-zone" },
                { name: "Elito", slug: "elito" },
              ]).map((b) => (
                <li key={b.slug}>
                  <Link
                    to={`/category/${slug}?battery_brand=${b.slug}`}
                    className={`hover:text-primary ${brandSlug === b.slug ? "text-primary font-bold" : ""}`}
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
            {(brandSlug || carModelSlug) && (
              <Link to={`/category/${slug}`} className="text-xs text-primary underline mt-3 inline-block">
                Clear filters
              </Link>
            )}
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white border border-line">
              <p className="text-muted-foreground">No products match your filters.</p>
              <Link to={`/category/${slug}`} className="text-primary font-bold underline mt-2 inline-block">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
