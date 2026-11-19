import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Car } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCarBrands, useCarModelsByBrandId } from "@/hooks/queries/useBrands";

const ALL = "__all__";

/** Car battery shop header: vehicle-first picker writing car_brand / car_model URL params. */
export function CarShopHero({ count }: { count: number }) {
  const [params, setParams] = useSearchParams();
  const brandSlug = params.get("car_brand") ?? "";
  const modelSlug = params.get("car_model") ?? "";

  const { data: brands = [] } = useCarBrands();
  const brand = brands.find((b) => b.slug === brandSlug) ?? null;
  const { data: models = [] } = useCarModelsByBrandId(brand?.id);
  const model = models.find((m) => m.slug === modelSlug) ?? null;

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("page");
    setParams(p);
  };

  const vehicle = brand ? [brand.name, model?.name].filter(Boolean).join(" ") : null;

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 bg-dots" aria-hidden />
      <div className="container-x relative py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/60">
          <Link to="/" className="hover:text-white">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/shop" className="hover:text-white">Shop</Link>
          <span className="mx-1.5">/</span>
          <span className="text-white">Car batteries</span>
        </nav>
        <span className="eyebrow">Car batteries</span>
        <h1 className="mt-2 font-display-tight text-3xl font-bold sm:text-4xl lg:text-5xl">
          {vehicle ? <>Batteries for your <span className="text-volt">{vehicle}</span></> : "Find the right battery for your car"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
          Pick your car and we'll show only batteries that fit it, with free delivery and doorstep installation.
        </p>

        <div className="mt-6 grid max-w-3xl gap-2 rounded-3xl bg-white p-2 shadow-elevated sm:grid-cols-[1fr_1fr_auto]">
          <Select value={brandSlug || ALL} onValueChange={(v) => set({ car_brand: v === ALL ? null : v, car_model: null })}>
            <SelectTrigger aria-label="Car brand" className="h-12 rounded-2xl border-0 bg-muted/60 text-ink">
              <SelectValue placeholder="Car brand" />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-72 bg-white">
              <SelectItem value={ALL}>All car brands</SelectItem>
              {brands.map((b) => <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={modelSlug || ALL} onValueChange={(v) => set({ car_model: v === ALL ? null : v })} disabled={!brand}>
            <SelectTrigger aria-label="Car model" className="h-12 rounded-2xl border-0 bg-muted/60 text-ink">
              <SelectValue placeholder={brand ? "All models" : "Choose a brand first"} />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-72 bg-white">
              <SelectItem value={ALL}>All models</SelectItem>
              {models.map((m) => <SelectItem key={m.id} value={m.slug}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {brand ? (
            <button type="button" onClick={() => set({ car_brand: null, car_model: null })} className="h-12 rounded-2xl px-5 text-sm font-semibold text-ink hover:bg-muted">
              Change car
            </button>
          ) : (
            <div className="hidden items-center gap-2 px-4 text-sm text-muted-foreground sm:flex"><Car className="h-4 w-4" /> {brands.length} brands</div>
          )}
        </div>

        {brand ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-sm text-white">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {count} batter{count === 1 ? "y fits" : "ies fit"} your {vehicle}
          </p>
        ) : (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {brands.slice(0, 12).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => set({ car_brand: b.slug, car_model: null })}
                className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-4 text-sm text-white/85 backdrop-blur transition-colors hover:bg-white hover:text-ink"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
                  {b.logo_url ? <img src={b.logo_url} alt="" className="h-5 w-5 object-contain" /> : <Car className="h-4 w-4 text-ink" />}
                </span>
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
