import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LayoutGrid, BatteryCharging, CarFront, Car, Package, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCarBrands, useCarModelsByBrandId } from "@/hooks/queries/useBrands";
import { useProductIdsByModelIds } from "@/hooks/queries/useFitment";
import { getCarModelIdsByBrandIds } from "@/api/carModels";
import { Seo } from "@/components/Seo";

const ALL = "__all__";

const SearchResults = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  // ── Fitment filter state ──
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  const { data: carBrands = [] } = useCarBrands();
  const selectedBrand = carBrands.find((b) => b.id === selectedBrandId) ?? null;
  const { data: carModels = [] } = useCarModelsByBrandId(selectedBrand?.id);

  // Reset model when brand changes
  useEffect(() => { setSelectedModelId(""); }, [selectedBrandId]);

  // Resolve model IDs for fitment lookup
  const fitmentModelIds = useMemo(() => {
    if (selectedModelId) return [selectedModelId];
    return undefined; // will be populated below for brand-level filtering
  }, [selectedModelId]);

  // When only brand is selected (no model), get all model IDs for that brand
  const { data: brandModelIds } = useQuery({
    queryKey: ["search_fitment_brand_models", selectedBrandId],
    queryFn: () => getCarModelIdsByBrandIds([selectedBrandId]),
    enabled: !!selectedBrandId && !selectedModelId,
  });

  const effectiveModelIds = fitmentModelIds ?? brandModelIds;
  const { data: fitmentProductIds } = useProductIdsByModelIds(
    effectiveModelIds && effectiveModelIds.length > 0 ? effectiveModelIds : undefined,
  );

  const useFitment = !!selectedBrandId;

  const { data, isLoading } = useQuery({
    queryKey: ["search_results", q],
    enabled: q.length > 0,
    queryFn: async () => {
      const like = `%${q}%`;
      const [cats, brands, carBrandsResult, models, prods] = await Promise.all([
        supabase.from("categories").select("id,name,slug,icon").ilike("name", like).limit(8),
        supabase.from("battery_brands").select("id,name,slug,logo_url").ilike("name", like).limit(8),
        supabase.from("car_brands").select("id,name,slug,logo_url").ilike("name", like).limit(8),
        supabase.from("car_models").select("id,name,slug, car_brands(name,slug)").ilike("name", like).limit(12),
        supabase
          .from("products")
          .select("*, battery_brands(*), categories(slug,name)")
          .eq("status", "active")
          .or(`name.ilike.${like},sku.ilike.${like},short_description.ilike.${like}`)
          .limit(24),
      ]);
      return {
        categories: cats.data ?? [],
        brands: brands.data ?? [],
        carBrands: carBrandsResult.data ?? [],
        models: models.data ?? [],
        products: (prods.data ?? []) as any[],
      };
    },
  });

  // Filter products by fitment when a car brand/model is selected
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (!useFitment) return data.products;
    if (!fitmentProductIds) return []; // still loading fitment
    const idSet = new Set(fitmentProductIds);
    return data.products.filter((p: any) => idSet.has(p.id));
  }, [data?.products, useFitment, fitmentProductIds]);

  const totalCount = data
    ? data.categories.length + data.brands.length + data.carBrands.length + data.models.length + filteredProducts.length
    : 0;

  return (
    <div>
      <Seo title="Search Results" description="Search genuine car and inverter batteries at Kachi Batteries." path="/search" noindex />
      <header className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60 mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">Search</span>
          </nav>
          <span className="eyebrow">Search</span>
          <h1 className="font-display-tight text-3xl sm:text-4xl font-bold mt-2 break-words">
            {q ? <>Results for <span className="text-volt">"{q}"</span></> : "Search"}
          </h1>
          {q && !isLoading && (
            <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm text-white/85">
              {totalCount} match{totalCount === 1 ? "" : "es"} found
            </p>
          )}
        </div>
      </header>

      <div className="container-x py-6 md:py-10">

      {/* ── Fitment filter bar ── */}
      {q && (
        <div className="surface p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <CarFront className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold text-sm text-ink">
              Filter by vehicle
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <Select value={selectedBrandId || ALL} onValueChange={(v) => setSelectedBrandId(v === ALL ? "" : v)}>
              <SelectTrigger className="h-10 rounded-full border-line bg-background">
                <SelectValue placeholder="All car brands" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 max-h-72">
                <SelectItem value={ALL}>All car brands</SelectItem>
                {carBrands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedModelId || ALL}
              onValueChange={(v) => setSelectedModelId(v === ALL ? "" : v)}
              disabled={!selectedBrandId}
            >
              <SelectTrigger className="h-10 rounded-full border-line bg-background">
                <SelectValue placeholder={selectedBrandId ? "All models" : "Select brand first"} />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 max-h-72">
                <SelectItem value={ALL}>All models</SelectItem>
                {carModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {useFitment && (
              <button
                type="button"
                onClick={() => { setSelectedBrandId(""); setSelectedModelId(""); }}
                className="h-10 px-4 text-sm font-semibold text-primary border border-primary/25 rounded-full hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
              >
                Clear vehicle filter
              </button>
            )}
          </div>
          {useFitment && (
            <p className="text-xs text-muted-foreground mt-3">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} compatible with{" "}
              <span className="font-semibold text-ink">
                {selectedBrand?.name}
                {selectedModelId ? ` · ${carModels.find((m) => m.id === selectedModelId)?.name}` : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {!q && (
        <div className="surface p-10 text-center">
          <p className="text-muted-foreground">Type something to search.</p>
        </div>
      )}

      {q && isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {q && !isLoading && totalCount === 0 && (
        <div className="surface px-6 py-14 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted"><SearchX className="h-6 w-6 text-muted-foreground" /></span>
          <p className="font-display font-bold text-lg text-ink break-words">No results for "{q}"</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different model, brand, or battery type.</p>
          <Link to="/shop" className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Browse all batteries</Link>
        </div>
      )}

      {q && !isLoading && data && (
        <div className="space-y-8">
          {!useFitment && data.carBrands.length > 0 && (
            <Section icon={<CarFront className="h-4 w-4" />} title="Car brands" tone="bg-blue-500/10 text-blue-600">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.carBrands.map((b) => (
                  <Link
                    key={b.id}
                    to={`/shop?type=car-batteries&car_brand=${b.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-lg bg-blue-500/10 flex-shrink-0">
                      <CarFront className="h-4 w-4 text-blue-600" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-sm text-ink truncate">{b.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">All {b.name} batteries</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {!useFitment && data.models.length > 0 && (
            <Section icon={<Car className="h-4 w-4" />} title="Car models" tone="bg-amber-500/10 text-amber-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.models.map((m) => (
                  <Link
                    key={m.id}
                    to={`/shop?type=car-batteries&car_model=${m.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-lg bg-amber-500/10 flex-shrink-0">
                      <Car className="h-4 w-4 text-amber-600" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-bold text-sm text-ink truncate">{m.name}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {m.car_brands?.name ? `${m.car_brands.name} · ` : ""}Batteries that fit
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {!useFitment && data.categories.length > 0 && (
            <Section icon={<LayoutGrid className="h-4 w-4" />} title="Battery categories" tone="bg-primary/10 text-primary">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 flex-shrink-0">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                    </span>
                    <span className="flex-1 font-bold text-sm text-ink truncate">{c.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {!useFitment && data.brands.length > 0 && (
            <Section icon={<BatteryCharging className="h-4 w-4" />} title="Battery brands" tone="bg-emerald-500/10 text-emerald-600">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.brands.map((b) => (
                  <Link
                    key={b.id}
                    to={`/brand/${b.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-lg bg-emerald-500/10 flex-shrink-0 overflow-hidden">
                      {b.logo_url
                        ? <img src={b.logo_url} alt="" className="h-7 w-7 object-contain" />
                        : <BatteryCharging className="h-4 w-4 text-emerald-600" />}
                    </span>
                    <span className="flex-1 font-bold text-sm text-ink truncate">{b.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {filteredProducts.length > 0 && (
            <Section icon={<Package className="h-4 w-4" />} title="Products" tone="bg-muted text-ink">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            </Section>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

function Section({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <span className={`h-8 w-8 grid place-items-center rounded-full ${tone}`}>{icon}</span>
        <h2 className="font-display font-bold text-lg text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default SearchResults;
