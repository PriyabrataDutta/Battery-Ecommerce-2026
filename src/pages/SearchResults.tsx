import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, LayoutGrid, BatteryCharging, CarFront, Car, Package, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/products/ProductCard";
import { formatINR } from "@/lib/format";

const SearchResults = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim();

  const { data, isLoading } = useQuery({
    queryKey: ["search_results", q],
    enabled: q.length > 0,
    queryFn: async () => {
      const like = `%${q}%`;
      const [cats, brands, carBrands, models, prods] = await Promise.all([
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
        carBrands: carBrands.data ?? [],
        models: models.data ?? [],
        products: (prods.data ?? []) as any[],
      };
    },
  });

  const totalCount = data
    ? data.categories.length + data.brands.length + data.carBrands.length + data.models.length + data.products.length
    : 0;

  return (
    <div className="container-x py-6 md:py-10">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:text-primary">Home</Link> / <span className="text-ink">Search</span>
      </nav>

      <header className="mb-5">
        <h1 className="font-display-tight text-2xl md:text-3xl font-bold">
          {q ? <>Results for <span className="text-primary">"{q}"</span></> : "Search"}
        </h1>
        {q && !isLoading && (
          <p className="text-sm text-muted-foreground mt-1">{totalCount} match{totalCount === 1 ? "" : "es"} found</p>
        )}
      </header>

      {!q && (
        <div className="bg-white border border-line p-8 text-center">
          <p className="text-muted-foreground">Type something to search.</p>
        </div>
      )}

      {q && isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />)}
        </div>
      )}

      {q && !isLoading && totalCount === 0 && (
        <div className="bg-white border border-line p-10 text-center">
          <SearchX className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold text-ink">No results for "{q}"</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different model, brand, or battery type.</p>
          <Link to="/shop" className="inline-block mt-4 text-primary font-bold underline">Browse all batteries</Link>
        </div>
      )}

      {q && !isLoading && data && (
        <div className="space-y-8">
          {data.carBrands.length > 0 && (
            <Section icon={<CarFront className="h-4 w-4" />} title="Car Brands" tone="bg-blue-500/10 text-blue-600">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.carBrands.map((b) => (
                  <Link
                    key={b.id}
                    to={`/shop?type=car-batteries&car_brand=${b.slug}`}
                    className="flex items-center gap-3 bg-white border border-line p-3 hover:border-primary transition-colors"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-md bg-blue-500/10 flex-shrink-0">
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

          {data.models.length > 0 && (
            <Section icon={<Car className="h-4 w-4" />} title="Car Models" tone="bg-amber-500/10 text-amber-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.models.map((m) => (
                  <Link
                    key={m.id}
                    to={`/shop?type=car-batteries&car_model=${m.slug}`}
                    className="flex items-center gap-3 bg-white border border-line p-3 hover:border-primary transition-colors"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-md bg-amber-500/10 flex-shrink-0">
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

          {data.categories.length > 0 && (
            <Section icon={<LayoutGrid className="h-4 w-4" />} title="Battery Categories" tone="bg-primary/10 text-primary">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="flex items-center gap-3 bg-white border border-line p-3 hover:border-primary transition-colors"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-md bg-primary/10 flex-shrink-0">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                    </span>
                    <span className="flex-1 font-bold text-sm text-ink truncate">{c.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {data.brands.length > 0 && (
            <Section icon={<BatteryCharging className="h-4 w-4" />} title="Battery Brands" tone="bg-emerald-500/10 text-emerald-600">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.brands.map((b) => (
                  <Link
                    key={b.id}
                    to={`/brand/${b.slug}`}
                    className="flex items-center gap-3 bg-white border border-line p-3 hover:border-primary transition-colors"
                  >
                    <span className="h-9 w-9 grid place-items-center rounded-md bg-emerald-500/10 flex-shrink-0 overflow-hidden">
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

          {data.products.length > 0 && (
            <Section icon={<Package className="h-4 w-4" />} title="Products" tone="bg-muted text-ink">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
};

function Section({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-7 w-7 grid place-items-center rounded-md ${tone}`}>{icon}</span>
        <h2 className="font-display font-bold text-base uppercase tracking-wider text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default SearchResults;
