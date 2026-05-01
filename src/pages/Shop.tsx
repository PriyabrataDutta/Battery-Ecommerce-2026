import { useSearchParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopFilters } from "@/components/products/ShopFilters";
import { ActiveFilters } from "@/components/products/ActiveFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import type { Product } from "@/types/catalog";
import { useProducts } from "@/hooks/queries/useProducts";
import { useCategoryBySlug } from "@/hooks/queries/useCategories";
import {
  useResolveBatteryBrandSlugByName,
  useResolveCarModelIdByName,
  useCarBrandIdBySlug,
  useCarModelIdBySlug,
  useCarModelIdsByBrandIds,
  useCarBrandIdsBySlugs,
} from "@/hooks/queries/useBrands";
import { useProductIdsByModelIds } from "@/hooks/queries/useFitment";

type SortKey = "relevance" | "popularity" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const sort = (params.get("sort") as SortKey) || "relevance";
  const view: "grid" | "list" = params.get("view") === "list" ? "list" : "grid";

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (value === null || value === "") p.delete(key);
    else p.set(key, value);
    setParams(p, { replace: true });
  };

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

  const { data: typeCategory } = useCategoryBySlug(type ?? undefined);

  // Resolve free-text q to a brand or car model so searches like "amaron" or "baleno" return useful results
  const { data: qBrandSlug } = useResolveBatteryBrandSlugByName(q);
  const { data: qCarModelId } = useResolveCarModelIdByName(q);
  const qResolved = { brandSlug: qBrandSlug ?? null, carModelId: qCarModelId ?? null };

  const effectiveBrand = brandSlug || qResolved.brandSlug || null;

  // Resolve car_brand slug -> all model ids (for fitment filtering by car brand)
  const { data: carBrandId } = useCarBrandIdBySlug(carBrandSlug ?? undefined);
  const { data: carBrandModelIds } = useCarModelIdsByBrandIds(
    carBrandId ? [carBrandId] : undefined,
  );

  // Resolve multi-select car_brands -> product ids via fitment
  const { data: carBrandsIds } = useCarBrandIdsBySlugs(carBrandSlugs);
  const { data: carBrandsModelIds } = useCarModelIdsByBrandIds(carBrandsIds);
  const { data: carBrandsProductIds } = useProductIdsByModelIds(carBrandsModelIds);

  // Resolve a single car model slug -> id
  const { data: carModelIdFromSlug } = useCarModelIdBySlug(carModelSlug ?? undefined);

  const { data: products = [], isLoading } = useProducts({
    categorySlug: type ?? undefined,
  });

  // Apply free-text filter client-side when q didn't resolve to brand/model
  const textFiltered = useMemo(() => {
    if (!q || qResolved.brandSlug || qResolved.carModelId) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.short_description ?? "").toLowerCase().includes(q)
    );
  }, [products, q, qResolved.brandSlug, qResolved.carModelId]);

  // Compute fitment model ids (from URL car_model, q-resolved model, or car_brand)
  const fitmentModelIds = useMemo(() => {
    if (qResolved.carModelId) return [qResolved.carModelId];
    if (carModelIdFromSlug) return [carModelIdFromSlug];
    if (carBrandSlug && carBrandModelIds) return carBrandModelIds;
    return [];
  }, [qResolved.carModelId, carModelIdFromSlug, carBrandSlug, carBrandModelIds]);

  const { data: fitmentProductIds } = useProductIdsByModelIds(
    fitmentModelIds.length > 0 ? fitmentModelIds : undefined,
  );

  // Full price bounds across all products in current category/search (ignores price filter)
  const priceBounds = useMemo(() => {
    if (textFiltered.length === 0) return { min: 0, max: 0 };
    let min = Infinity, max = -Infinity;
    for (const p of textFiltered) {
      const v = Number(p.price) || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min: Math.floor(min), max: Math.ceil(max) };
  }, [textFiltered]);

  const minPrice = minPriceParam !== null ? Number(minPriceParam) : priceBounds.min;
  const maxPrice = maxPriceParam !== null ? Number(maxPriceParam) : priceBounds.max;

  // Products after car/category/price filters but BEFORE battery brand filter — used to count by battery brand
  const preBrandFiltered = useMemo(() => {
    let list = textFiltered;
    const useFitment = !!carModelSlug || !!qResolved.carModelId || !!carBrandSlug;
    if (useFitment) {
      if (!fitmentProductIds) {
        list = [];
      } else {
        const set = new Set(fitmentProductIds);
        list = list.filter((p) => set.has(p.id));
      }
    }
    if (carBrandSlugs.length > 0) {
      if (!carBrandsProductIds) {
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
  }, [textFiltered, carModelSlug, qResolved.carModelId, carBrandSlug, fitmentProductIds, minPrice, maxPrice, carBrandSlugs, carBrandsProductIds]);

  const filtered = useMemo(() => {
    if (!effectiveBrand) return preBrandFiltered;
    return preBrandFiltered.filter((p) => p.battery_brands?.slug === effectiveBrand);
  }, [preBrandFiltered, effectiveBrand]);

  // Apply sort to the visible product list
  const sorted = useMemo(() => {
    const list = [...filtered];
    const popularity = (p: Product) =>
      (p.is_bestseller ? 100 : 0) + (p.is_featured ? 50 : 0) + (p.is_new ? 10 : 0);
    switch (sort) {
      case "price_asc":
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "popularity":
        list.sort((a, b) => popularity(b) - popularity(a));
        break;
      case "newest":
        list.sort((a, b) => {
          const da = (a as Product & { created_at?: string }).created_at;
          const db = (b as Product & { created_at?: string }).created_at;
          return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
        });
        break;
      default:
        list.sort((a, b) => popularity(b) - popularity(a));
    }
    return list;
  }, [filtered, sort]);

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
        <Link to="/" className="hover:text-primary">Home</Link> /{" "}
        {type ? (
          <>
            <Link to="/shop" className="hover:text-primary">Shop</Link> /{" "}
            <span className="text-ink">{typeCategory?.name ?? type}</span>
          </>
        ) : (
          <span className="text-ink">Shop</span>
        )}
      </nav>
      <h1 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold">
        {type ? (typeCategory?.name ?? "Shop") : "Shop Batteries"}
      </h1>
      {type && typeCategory?.description && (
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">{typeCategory.description}</p>
      )}
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
          <ActiveFilters priceBounds={priceBounds} />

          {/* Toolbar: sort + view toggle */}
          <div className="flex items-center justify-between gap-3 mb-4 bg-white border border-line p-2.5 sm:p-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs uppercase tracking-wider font-display font-bold text-muted-foreground">
                Sort
              </span>
              <Select value={sort} onValueChange={(v) => setParam("sort", v === "relevance" ? null : v)}>
                <SelectTrigger className="h-9 w-[180px] sm:w-[200px] border-line text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center border border-line">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setParam("view", null)}
                className={`p-2 transition-colors ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-ink hover:text-primary"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setParam("view", "list")}
                className={`p-2 border-l border-line transition-colors ${
                  view === "list"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-ink hover:text-primary"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-white border border-line">
              <p className="text-muted-foreground">No products match your filters.</p>
              <Link to="/shop" className="text-primary font-bold underline mt-2 inline-block">Clear filters</Link>
            </div>
          ) : (
            <div
              className={
                view === "list"
                  ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                  : "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              }
            >
              {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
