import { useSearchParams, Link, useLocation } from "react-router-dom";
import { useMemo, useEffect, useRef } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { ShopFilters } from "@/components/products/ShopFilters";
import { ActiveFilters } from "@/components/products/ActiveFilters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
import { useCarBrands, useCarModelsByBrandId } from "@/hooks/queries/useBrands";
import { CarShopHero } from "./shop/CarShopHero";
import { InverterShopHero } from "./shop/InverterShopHero";
import { InverterFilters } from "./shop/InverterFilters";
import { INVERTER_SLUGS } from "./shop/inverterKinds";

export type ShopVariant = "all" | "car" | "inverter";

type SortKey = "relevance" | "popularity" | "price_asc" | "price_desc" | "newest";

const PAGE_SIZE = 20;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

/** Build an array of page numbers to render, with ellipsis gaps. */
function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  if (total > 1) pages.push(total);
  return pages;
}

const Shop = ({ variant = "all" }: { variant?: ShopVariant }) => {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const sort = (params.get("sort") as SortKey) || "relevance";
  const view: "grid" | "list" = params.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const gridRef = useRef<HTMLDivElement>(null);

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(params);
    if (value === null || value === "") p.delete(key);
    else p.set(key, value);
    setParams(p, { replace: true });
  };

  const goToPage = (n: number) => {
    const p = new URLSearchParams(params);
    if (n <= 1) p.delete("page");
    else p.set("page", String(n));
    setParams(p, { replace: false });
  };

  const q = params.get("q")?.toLowerCase() ?? "";
  const type = params.get("type"); // category slug
  const carModelSlug = params.get("car_model");
  const carBrandSlug = params.get("car_brand");
  const brandSlug = params.get("battery_brand");
  const minPriceParam = params.get("min_price");
  const maxPriceParam = params.get("max_price");
  const carBrandsCsv = params.get("car_brands") ?? "";
  const kind = variant === "inverter" ? params.get("kind") : null;
  const minCapacity = Number(params.get("min_capacity")) || 0;

  const carBrandSlugs = useMemo(
    () => carBrandsCsv.split(",").map((s) => s.trim()).filter(Boolean),
    [carBrandsCsv]
  );

  const { data: typeCategory } = useCategoryBySlug(type ?? undefined);

  const { data: qBrandSlug } = useResolveBatteryBrandSlugByName(q);
  const { data: qCarModelId } = useResolveCarModelIdByName(q);
  const qResolved = { brandSlug: qBrandSlug ?? null, carModelId: qCarModelId ?? null };

  const effectiveBrand = brandSlug || qResolved.brandSlug || null;

  const { data: carBrandId } = useCarBrandIdBySlug(carBrandSlug ?? undefined);
  const { data: carBrandModelIds } = useCarModelIdsByBrandIds(
    carBrandId ? [carBrandId] : undefined,
  );

  const { data: carBrandsIds } = useCarBrandIdsBySlugs(carBrandSlugs);
  const { data: carBrandsModelIds } = useCarModelIdsByBrandIds(carBrandsIds);
  const { data: carBrandsProductIds } = useProductIdsByModelIds(carBrandsModelIds);

  const { data: carModelIdFromSlug } = useCarModelIdBySlug(carModelSlug ?? undefined);

  const { data: products = [], isLoading } = useProducts(
    variant === "car"
      ? { categorySlugs: ["car-batteries"] }
      : variant === "inverter"
        ? { categorySlugs: INVERTER_SLUGS }
        : { categorySlug: type ?? undefined },
  );

  const textFiltered = useMemo(() => {
    if (!q || qResolved.brandSlug || qResolved.carModelId) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.short_description ?? "").toLowerCase().includes(q)
    );
  }, [products, q, qResolved.brandSlug, qResolved.carModelId]);

  const fitmentModelIds = useMemo(() => {
    if (qResolved.carModelId) return [qResolved.carModelId];
    if (carModelIdFromSlug) return [carModelIdFromSlug];
    if (carBrandSlug && carBrandModelIds) return carBrandModelIds;
    return [];
  }, [qResolved.carModelId, carModelIdFromSlug, carBrandSlug, carBrandModelIds]);

  const { data: fitmentProductIds } = useProductIdsByModelIds(
    fitmentModelIds.length > 0 ? fitmentModelIds : undefined,
  );

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
    if (kind) list = list.filter((p) => p.categories?.slug === kind);
    if (minCapacity) list = list.filter((p) => (p.capacity_ah ?? 0) >= minCapacity);
    return list;
  }, [textFiltered, carModelSlug, qResolved.carModelId, carBrandSlug, fitmentProductIds, minPrice, maxPrice, carBrandSlugs, carBrandsProductIds, kind, minCapacity]);

  // "Maruti Suzuki Swift" for the fit badge on car-shop cards
  const { data: allCarBrands = [] } = useCarBrands();
  const fitBrand = variant === "car" ? allCarBrands.find((b) => b.slug === carBrandSlug) : undefined;
  const { data: fitModels = [] } = useCarModelsByBrandId(fitBrand?.id);
  const fitLabel = fitBrand
    ? [fitBrand.name, fitModels.find((m) => m.slug === carModelSlug)?.name].filter(Boolean).join(" ")
    : undefined;

  const capacities = useMemo(
    () => [...new Set(textFiltered.map((p) => p.capacity_ah).filter((c): c is number => !!c))].sort((a, b) => a - b),
    [textFiltered],
  );

  const filtered = useMemo(() => {
    if (!effectiveBrand) return preBrandFiltered;
    return preBrandFiltered.filter((p) => p.battery_brands?.slug === effectiveBrand);
  }, [preBrandFiltered, effectiveBrand]);

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

  // ─── Pagination ───
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );
  const pageNumbers = useMemo(() => buildPageNumbers(safePage, totalPages), [safePage, totalPages]);

  // Reset to page 1 when filters change the result count
  const prevFilteredLen = useRef(filtered.length);
  useEffect(() => {
    if (filtered.length !== prevFilteredLen.current && page > 1) {
      goToPage(1);
    }
    prevFilteredLen.current = filtered.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length]);

  // Scroll to top of grid on page change
  useEffect(() => {
    if (page > 1) {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);

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
    <div>
      {variant === "car" ? (
        <CarShopHero count={filtered.length} />
      ) : variant === "inverter" ? (
        <InverterShopHero count={filtered.length} />
      ) : (
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60 mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-1.5">/</span>
            {type ? (
              <>
                <Link to="/shop" className="hover:text-white">Shop</Link>
                <span className="mx-1.5">/</span>
                <span className="text-white">{typeCategory?.name ?? type}</span>
              </>
            ) : (
              <span className="text-white">Shop</span>
            )}
          </nav>
          <span className="eyebrow">Shop</span>
          <h1 className="font-display-tight text-3xl sm:text-4xl lg:text-5xl font-bold mt-2">
            {type ? (typeCategory?.name ?? "Shop") : "Shop batteries"}
          </h1>
          {type && typeCategory?.description && (
            <p className="text-white/70 mt-3 max-w-2xl text-sm sm:text-base">{typeCategory.description}</p>
          )}
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm text-white/85">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            {totalPages > 1 && <span>· Page {safePage} of {totalPages}</span>}
          </p>
        </div>
      </section>
      )}

      <div className="container-x py-6 sm:py-10">
      <div className="grid lg:grid-cols-[280px_1fr] gap-6 sm:gap-8">
        <aside className="min-w-0">
          <details className="lg:hidden surface group" open={false}>
            <summary className="cursor-pointer list-none flex items-center justify-between px-5 py-4 font-display font-bold text-sm">
              <span>Filters</span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-primary text-base group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-5 pb-5">
              {variant === "inverter" && <div className="mb-6"><InverterFilters capacities={capacities} /></div>}
              <ShopFilters counts={counts} priceBounds={priceBounds} showCar={variant !== "inverter"} />
            </div>
          </details>

          <div className="hidden lg:block surface p-6 lg:sticky lg:top-40">
            <h2 className="font-display font-bold text-base mb-4">Filters</h2>
            {variant === "inverter" && <div className="mb-6"><InverterFilters capacities={capacities} /></div>}
            <ShopFilters counts={counts} priceBounds={priceBounds} showCar={variant !== "inverter"} />
          </div>
        </aside>
        <div ref={gridRef} id="shop-results" className="min-w-0 scroll-mt-40">
          <ActiveFilters priceBounds={priceBounds} />

          {/* Toolbar: sort + view toggle */}
          <div className="surface flex items-center justify-between gap-3 mb-5 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Sort by</span>
              <Select value={sort} onValueChange={(v) => setParam("sort", v === "relevance" ? null : v)}>
                <SelectTrigger aria-label="Sort products" className="h-9 sm:h-10 w-[150px] sm:w-[220px] rounded-full border-line text-xs sm:text-sm">
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
            <div className="flex items-center gap-1 rounded-full bg-muted p-1 shrink-0">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setParam("view", null)}
                className={`rounded-full p-1.5 sm:p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === "grid" ? "bg-white text-primary shadow-card" : "text-muted-foreground hover:text-ink"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setParam("view", "list")}
                className={`rounded-full p-1.5 sm:p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  view === "list" ? "bg-white text-primary shadow-card" : "text-muted-foreground hover:text-ink"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="surface text-center px-6 py-16 sm:py-20">
              <p className="font-display font-bold text-lg">No products match your filters</p>
              <p className="text-muted-foreground text-sm mt-1">Try removing a filter or widening the price range.</p>
              <Link to={pathname} className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div
                className={
                  view === "list"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5"
                    : "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
                }
              >
                {paged.map((p) => <ProductCard key={p.id} product={p} showSpecs={variant === "inverter"} fitLabel={fitLabel} />)}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <Pagination className="mt-8 sm:mt-10">
                  <PaginationContent className="flex-wrap gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => safePage > 1 && goToPage(safePage - 1)}
                        className={`rounded-full ${safePage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
                      />
                    </PaginationItem>

                    {pageNumbers.map((n, i) =>
                      n === "ellipsis" ? (
                        <PaginationItem key={`e${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={n}>
                          <PaginationLink
                            isActive={n === safePage}
                            onClick={() => goToPage(n)}
                            className="cursor-pointer rounded-full"
                          >
                            {n}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => safePage < totalPages && goToPage(safePage + 1)}
                        className={`rounded-full ${safePage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Shop;
