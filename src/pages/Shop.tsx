import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopFilters } from "@/components/products/ShopFilters";
import type { Product } from "@/types/catalog";
import { useMemo } from "react";

const Shop = () => {
  const [params] = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const type = params.get("type"); // category slug
  const carModelSlug = params.get("car_model");
  const carBrandSlug = params.get("car_brand");
  const brandSlug = params.get("battery_brand");
  const minPriceParam = params.get("min_price");
  const maxPriceParam = params.get("max_price");
  const carBrandsCsv = params.get("car_brands") ?? "";
  const carBrandSlugs = useMemo(
    () => carBrandsCsv.split(",").map((s) => s.trim()).filter(Boolean),
    [carBrandsCsv]
  );

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

  // Resolve multi-select car_brands -> product ids via fitment
  const { data: carBrandsProductIds } = useQuery({
    queryKey: ["car_brands_product_ids", carBrandSlugs],
    enabled: carBrandSlugs.length > 0,
    queryFn: async (): Promise<string[]> => {
      const { data: brands } = await supabase
        .from("car_brands")
        .select("id")
        .in("slug", carBrandSlugs);
      const brandIds = (brands ?? []).map((b) => b.id);
      if (brandIds.length === 0) return [];
      const { data: models } = await supabase
        .from("car_models")
        .select("id")
        .in("car_brand_id", brandIds);
      const modelIds = (models ?? []).map((m) => m.id);
      if (modelIds.length === 0) return [];
      const { data: fits } = await supabase
        .from("product_fitment")
        .select("product_id")
        .in("car_model_id", modelIds);
      return Array.from(new Set((fits ?? []).map((r) => r.product_id)));
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
      // battery brand filter applied later (client-side) so we can compute per-brand counts
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

  // Full price bounds across all products in current category/search (ignores price filter)
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    let min = Infinity, max = -Infinity;
    for (const p of products) {
      const v = Number(p.price) || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  const minPrice = minPriceParam !== null ? Number(minPriceParam) : priceBounds.min;
  const maxPrice = maxPriceParam !== null ? Number(maxPriceParam) : priceBounds.max;

  // Products after car/category/price filters but BEFORE battery brand filter — used to count by battery brand
  const preBrandFiltered = useMemo(() => {
    let list = products;
    const useFitment = !!carModelSlug || !!qResolved?.carModelId || !!carBrandSlug;
    if (useFitment && fitmentProductIds) {
      list = list.filter((p) => fitmentProductIds.includes(p.id));
    }
    if (carBrandSlugs.length > 0) {
      if (!carBrandsProductIds) {
        // While loading, show empty to avoid flashing wrong results
        list = [];
      } else {
        const set = new Set(carBrandsProductIds);
        list = list.filter((p) => set.has(p.id));
      }
    }
    list = list.filter((p) => {
      const v = Number(p.price) || 0;
      return v >= minPrice && v <= maxPrice;
    });
    return list;
  }, [products, carModelSlug, qResolved?.carModelId, carBrandSlug, fitmentProductIds, minPrice, maxPrice, carBrandSlugs, carBrandsProductIds]);

  const filtered = useMemo(() => {
    if (!effectiveBrand) return preBrandFiltered;
    return preBrandFiltered.filter((p) => p.battery_brands?.slug === effectiveBrand);
  }, [preBrandFiltered, effectiveBrand]);

  const counts = useMemo(() => {
    const byBatteryBrand: Record<string, number> = {};
    for (const p of preBrandFiltered) {
      const slug = p.battery_brands?.slug;
      if (!slug) continue;
      byBatteryBrand[slug] = (byBatteryBrand[slug] ?? 0) + 1;
    }
    return { byBatteryBrand, total: preBrandFiltered.length };
  }, [preBrandFiltered]);

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
              <span>Filters</span>
              <span className="text-primary text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-4 pb-4">
              <ShopFilters counts={counts} priceBounds={priceBounds} />
            </div>
          </details>

          <div className="hidden lg:block bg-white border border-line p-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4">Filters</h3>
            <ShopFilters counts={counts} priceBounds={priceBounds} />
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
