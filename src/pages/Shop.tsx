import { useSearchParams, Link } from "react-router-dom";
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

const Shop = () => {
  const [params, setParams] = useSearchParams();
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

  const { data: products = [], isLoading } = useProducts({
    categorySlug: type ?? undefined,
  });

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
    return list;
  }, [textFiltered, carModelSlug, qResolved.carModelId, carBrandSlug, fitmentProductIds, minPrice, maxPrice, carBrandSlugs, carBrandsProductIds]);

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
      <p className="text-muted-foreground mt-1 text-sm">
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        {totalPages > 1 && (
          <span className="ml-1">
            · Page {safePage} of {totalPages}
          </span>
        )}
      </p>

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
        <div ref={gridRef}>
          <ActiveFilters priceBounds={priceBounds} />

          {/* Toolbar: sort + view toggle */}
          <div className="flex items-center justify-between gap-3 mb-4 bg-white border border-line p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h3 className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
                Sort
              </h3>
              <Select value={sort} onValueChange={(v) => setParam("sort", v === "relevance" ? null : v)}>
                <SelectTrigger className="h-9 sm:h-10 w-[150px] sm:w-[220px] border-line text-xs sm:text-sm">
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
            <div className="flex items-center border border-line shrink-0">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setParam("view", null)}
                className={`p-1.5 sm:p-2 transition-colors ${
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
                className={`p-1.5 sm:p-2 border-l border-line transition-colors ${
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
            <>
              <div
                className={
                  view === "list"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                    : "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                }
              >
                {paged.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <Pagination className="mt-6 sm:mt-8">
                  <PaginationContent className="flex-wrap gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => safePage > 1 && goToPage(safePage - 1)}
                        className={safePage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
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
                            className="cursor-pointer"
                          >
                            {n}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => safePage < totalPages && goToPage(safePage + 1)}
                        className={safePage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
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
  );
};

export default Shop;
