import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { FitmentSearch } from "@/components/products/FitmentSearch";
import type { Product } from "@/types/catalog";
import { useMemo } from "react";

const Shop = () => {
  const [params] = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const type = params.get("type"); // category slug
  const carModelSlug = params.get("car_model");
  const brandSlug = params.get("battery_brand");

  // Resolve free-text q to a brand or car model so searches like "amaron" or "baleno" return useful results
  const { data: qResolved } = useQuery({
    queryKey: ["shop_q_resolve", q],
    enabled: !!q,
    queryFn: async () => {
      const like = `%${q}%`;
      const [brand, model] = await Promise.all([
        supabase.from("battery_brands").select("slug").ilike("name", like).limit(1).maybeSingle(),
        supabase.from("car_models").select("id,slug").ilike("name", like).limit(1).maybeSingle(),
      ]);
      return { brandSlug: brand.data?.slug ?? null, carModelId: model.data?.id ?? null };
    },
  });

  const effectiveBrand = brandSlug || qResolved?.brandSlug || null;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop", { q, type, carModelSlug, brandSlug, qBrand: qResolved?.brandSlug }],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from("products")
        .select("*, battery_brands(*), categories!inner(slug)")
        .eq("status", "active");
      if (type) query = query.eq("categories.slug", type);
      const { data, error } = await query;
      if (error) throw error;
      let list = data as unknown as Product[];
      if (q && !qResolved?.brandSlug && !qResolved?.carModelId) {
        list = list.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.short_description ?? "").toLowerCase().includes(q)
        );
      }
      if (effectiveBrand) list = list.filter((p) => p.battery_brands?.slug === effectiveBrand);
      return list;
    },
  });

  // Apply car model fitment filter via separate query (from URL or resolved from q)
  const { data: fitmentProductIds } = useQuery({
    queryKey: ["fitment_ids", carModelSlug, qResolved?.carModelId],
    enabled: !!carModelSlug || !!qResolved?.carModelId,
    queryFn: async (): Promise<string[]> => {
      let modelId = qResolved?.carModelId ?? null;
      if (!modelId && carModelSlug) {
        const { data: model } = await supabase.from("car_models").select("id").eq("slug", carModelSlug).maybeSingle();
        modelId = model?.id ?? null;
      }
      if (!modelId) return [];
      const { data } = await supabase.from("product_fitment").select("product_id").eq("car_model_id", modelId);
      return (data ?? []).map((r) => r.product_id);
    },
  });

  const filtered = useMemo(() => {
    const useFitment = !!carModelSlug || !!qResolved?.carModelId;
    if (!useFitment) return products;
    if (!fitmentProductIds) return products;
    return products.filter((p) => fitmentProductIds.includes(p.id));
  }, [products, carModelSlug, qResolved?.carModelId, fitmentProductIds]);

  return (
    <div className="container-x py-10">
      <nav className="text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-ink">Shop</span>
      </nav>
      <h1 className="font-display-tight text-4xl font-bold">Shop Batteries</h1>
      <p className="text-muted-foreground mt-1">{filtered.length} products</p>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8 mt-8">
        <aside className="space-y-6">
          <div className="bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Find by Vehicle</h3>
            <FitmentSearch embedded />
          </div>
          <div className="bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Battery Brand</h3>
            <ul className="space-y-2 text-sm">
              {["amaron","exide","power-zone","elito"].map((s) => (
                <li key={s}>
                  <Link to={`/shop?battery_brand=${s}`} className="hover:text-primary capitalize">{s.replace("-", " ")}</Link>
                </li>
              ))}
            </ul>
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
              <Link to="/shop" className="text-primary font-bold underline mt-2 inline-block">Clear filters</Link>
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

export default Shop;
