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
  const carBrandSlug = params.get("car_brand");
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

  // Resolve car_brand slug -> all model ids (for fitment filtering by car brand)
  const { data: carBrandModelIds } = useQuery({
    queryKey: ["car_brand_models", carBrandSlug],
    enabled: !!carBrandSlug,
    queryFn: async (): Promise<string[]> => {
      const { data: brand } = await supabase.from("car_brands").select("id").eq("slug", carBrandSlug!).maybeSingle();
      if (!brand) return [];
      const { data: models } = await supabase.from("car_models").select("id").eq("car_brand_id", brand.id);
      return (models ?? []).map((m) => m.id);
    },
  });

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

  // Apply car model fitment filter via separate query (from URL, resolved from q, or from car_brand)
  const { data: fitmentProductIds } = useQuery({
    queryKey: ["fitment_ids", carModelSlug, qResolved?.carModelId, carBrandSlug, carBrandModelIds],
    enabled: !!carModelSlug || !!qResolved?.carModelId || (!!carBrandSlug && !!carBrandModelIds),
    queryFn: async (): Promise<string[]> => {
      let modelIds: string[] = [];
      if (qResolved?.carModelId) modelIds = [qResolved.carModelId];
      else if (carModelSlug) {
        const { data: model } = await supabase.from("car_models").select("id").eq("slug", carModelSlug).maybeSingle();
        if (model?.id) modelIds = [model.id];
      } else if (carBrandSlug && carBrandModelIds) {
        modelIds = carBrandModelIds;
      }
      if (modelIds.length === 0) return [];
      const { data } = await supabase.from("product_fitment").select("product_id").in("car_model_id", modelIds);
      return Array.from(new Set((data ?? []).map((r) => r.product_id)));
    },
  });

  const filtered = useMemo(() => {
    const useFitment = !!carModelSlug || !!qResolved?.carModelId || !!carBrandSlug;
    if (!useFitment) return products;
    if (!fitmentProductIds) return products;
    return products.filter((p) => fitmentProductIds.includes(p.id));
  }, [products, carModelSlug, qResolved?.carModelId, carBrandSlug, fitmentProductIds]);

  return (
    <div className="container-x py-6 sm:py-10">
      <nav className="text-xs text-muted-foreground mb-3 sm:mb-4">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-ink">Shop</span>
      </nav>
      <h1 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold">Shop Batteries</h1>
      <p className="text-muted-foreground mt-1 text-sm">{filtered.length} products</p>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 sm:gap-8 mt-6 sm:mt-8">
        <aside className="space-y-4 sm:space-y-6">
          <details className="lg:hidden bg-white border border-line group" open={false}>
            <summary className="cursor-pointer list-none flex items-center justify-between p-4 font-display font-bold text-sm uppercase tracking-wider">
              <span>Filters & Vehicle Search</span>
              <span className="text-primary text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-4 pb-4 space-y-5">
              <div>
                <h3 className="font-display font-bold text-xs uppercase tracking-wider mb-3 text-muted-foreground">Find by Vehicle</h3>
                <FitmentSearch embedded />
              </div>
              <div>
                <h3 className="font-display font-bold text-xs uppercase tracking-wider mb-3 text-muted-foreground">Battery Brand</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {["amaron","exide","power-zone","elito"].map((s) => (
                    <li key={s}>
                      <Link to={`/shop?battery_brand=${s}`} className="block border border-line px-3 py-2 hover:border-primary hover:text-primary capitalize">{s.replace("-", " ")}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <div className="hidden lg:block bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Find by Vehicle</h3>
            <FitmentSearch embedded />
          </div>
          <div className="hidden lg:block bg-white border border-line p-5">
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white border border-line">
              <p className="text-muted-foreground">No products match your filters.</p>
              <Link to="/shop" className="text-primary font-bold underline mt-2 inline-block">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
