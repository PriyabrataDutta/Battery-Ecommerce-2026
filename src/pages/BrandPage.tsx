import { useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, BatteryCharging, Car, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBatteryBrandBySlug, useBatteryBrands } from "@/hooks/queries/useBrands";
import { useProducts } from "@/hooks/queries/useProducts";
import { formatINR } from "@/lib/format";
import { INVERTER_SLUGS } from "./shop/inverterKinds";
import type { Product } from "@/types/catalog";

type Range = "all" | "car" | "inverter";
const isCar = (p: Product) => p.categories?.slug === "car-batteries";
const isInverter = (p: Product) => (INVERTER_SLUGS as readonly string[]).includes(p.categories?.slug ?? "");
const price = (p: Product) => Number(p.price_without_exchange || p.price) || 0;
const popularity = (p: Product) => (p.is_bestseller ? 100 : 0) + (p.is_featured ? 50 : 0) + (p.is_new ? 10 : 0);

const SORTS = {
  popular: { label: "Most popular", fn: (a: Product, b: Product) => popularity(b) - popularity(a) },
  price_asc: { label: "Price: low to high", fn: (a: Product, b: Product) => price(a) - price(b) },
  price_desc: { label: "Price: high to low", fn: (a: Product, b: Product) => price(b) - price(a) },
} as const;
type SortKey = keyof typeof SORTS;

const PROMISES = [
  { Icon: BadgeCheck, t: "100% genuine", s: "Sourced through authorised distribution" },
  { Icon: ShieldCheck, t: "Manufacturer warranty", s: "Honoured at the brand's service centres" },
  { Icon: Wrench, t: "Doorstep installation", s: "Fitted at home, old battery picked up" },
  { Icon: RefreshCw, t: "Exchange & save", s: "Lower price when you return your old battery" },
];

const BrandPage = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const range = (["car", "inverter"].includes(params.get("range") ?? "") ? params.get("range") : "all") as Range;
  const sort = (params.get("sort") ?? "popular") in SORTS ? (params.get("sort") ?? "popular") as SortKey : "popular";

  const { data: brand, isLoading: brandLoading } = useBatteryBrandBySlug(slug);
  const { data: brands = [] } = useBatteryBrands();
  const { data: products = [], isLoading } = useProducts(brand ? { brandId: brand.id } : undefined);

  const carCount = products.filter(isCar).length;
  const invCount = products.filter(isInverter).length;
  const shown = useMemo(() => {
    const list = range === "car" ? products.filter(isCar) : range === "inverter" ? products.filter(isInverter) : [...products];
    return list.sort(SORTS[sort].fn);
  }, [products, range, sort]);

  const minPrice = products.length ? Math.min(...products.map(price).filter(Boolean)) : 0;
  const maxWarranty = Math.max(0, ...products.map((p) => p.warranty_months ?? 0));
  const rawTagline = brand?.description?.split("—").pop()?.trim();
  const tagline = rawTagline && rawTagline.charAt(0).toUpperCase() + rawTagline.slice(1);
  const name = brand?.name ?? slug ?? "";

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  if (!brandLoading && !brand) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display-tight text-3xl font-bold">Brand not found</h1>
        <Link to="/brands" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary">See all brands <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }

  const stats = [
    { k: String(products.length), v: products.length === 1 ? "product" : "products" },
    { k: minPrice ? formatINR(minPrice).replace(/\.\d+$/, "") : "—", v: "starting price" },
    { k: maxWarranty ? `${maxWarranty} mo` : "—", v: "max warranty" },
    { k: [carCount && "Car", invCount && "Inverter"].filter(Boolean).join(" · ") || "—", v: "range" },
  ];

  const tabs: { key: Range; label: string; n: number }[] = [
    { key: "all", label: "All", n: products.length },
    { key: "car", label: "Car batteries", n: carCount },
    { key: "inverter", label: "Inverter & home", n: invCount },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="container-x relative pb-24 pt-10 sm:pb-28 sm:pt-14">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-1.5">/</span>
            <Link to="/brands" className="hover:text-white">Brands</Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">{name}</span>
          </nav>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-24 w-40 shrink-0 place-items-center rounded-3xl bg-white p-4 shadow-elevated sm:h-28 sm:w-48">
              {brand?.logo_url ? (
                <img src={brand.logo_url} alt={`${name} logo`} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="font-display text-3xl font-extrabold text-ink">{name}</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="eyebrow">Authorised battery brand</span>
              <h1 className="mt-2 font-display-tight text-4xl font-bold sm:text-5xl lg:text-6xl">{name} batteries</h1>
              {tagline && <p className="mt-3 max-w-2xl text-base text-white/70 sm:text-lg">{tagline}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="container-x relative z-10 -mt-14 sm:-mt-16">
        <dl className="surface grid grid-cols-2 divide-line p-2 sm:grid-cols-4 sm:divide-x">
          {stats.map(({ k, v }) => (
            <div key={v} className="px-4 py-3 sm:px-6 sm:py-4">
              <dt className="truncate font-display text-xl font-extrabold text-ink sm:text-2xl">{isLoading ? "…" : k}</dt>
              <dd className="text-xs text-muted-foreground sm:text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Shop entry cards */}
      {(carCount > 0 || invCount > 0) && (
        <div className="container-x mt-6 grid gap-3 sm:grid-cols-2 sm:gap-5">
          {carCount > 0 && (
            <Link to={`/shop/car-batteries?battery_brand=${slug}`} className="group surface flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Car className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-bold text-ink">Find the {name} battery for your car</span>
                <span className="block text-sm text-muted-foreground">Pick your car and see the {name} models that fit</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          {invCount > 0 && (
            <Link to={`/shop/inverter-batteries?battery_brand=${slug}`} className="group surface flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><BatteryCharging className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-bold text-ink">{name} inverter & home batteries</span>
                <span className="block text-sm text-muted-foreground">Size your backup with the calculator</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      )}

      {/* Products */}
      <section className="container-x mt-12 sm:mt-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="eyebrow">The range</div>
            <h2 className="mt-2 font-display-tight text-3xl font-bold sm:text-4xl">Shop {name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-full border border-line bg-white p-1 shadow-card" role="tablist" aria-label="Product range">
              {tabs.filter((t) => t.key === "all" || t.n > 0).map((t) => (
                <button key={t.key} type="button" role="tab" aria-selected={range === t.key} onClick={() => setParam("range", t.key === "all" ? null : t.key)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${range === t.key ? "bg-ink text-white" : "text-ink/70 hover:text-ink"}`}>
                  {t.label} <span className={range === t.key ? "text-white/60" : "text-muted-foreground"}>{t.n}</span>
                </button>
              ))}
            </div>
            <Select value={sort} onValueChange={(v) => setParam("sort", v === "popular" ? null : v)}>
              <SelectTrigger aria-label="Sort products" className="h-10 w-[180px] rounded-full border-line bg-white text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="z-50 bg-white">
                {(Object.keys(SORTS) as SortKey[]).map((k) => <SelectItem key={k} value={k}>{SORTS[k].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading || brandLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="surface h-80 animate-pulse" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="surface mt-6 px-6 py-16 text-center">
            <p className="font-display text-lg font-bold">No {name} products here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Call or WhatsApp us and we'll source the model you need.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {shown.map((p) => <ProductCard key={p.id} product={p} showSpecs={isInverter(p)} />)}
          </div>
        )}
      </section>

      {/* Promises */}
      <section className="container-x mt-16 sm:mt-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="absolute inset-0 bg-dots opacity-50" aria-hidden />
          <div className="relative">
            <div className="eyebrow">Buying {name} from Kachi</div>
            <h2 className="mt-2 font-display-tight text-2xl font-bold sm:text-3xl">Genuine {name}, fitted at your door</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROMISES.map(({ Icon, t, s }) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary shadow-red"><Icon className="h-5 w-5" /></div>
                  <div className="mt-3 font-display font-bold">{t}</div>
                  <p className="mt-1 text-sm text-white/65">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Other brands */}
      {brands.length > 1 && (
        <section className="container-x mt-16 sm:mt-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display-tight text-2xl font-bold sm:text-3xl">Other brands we stock</h2>
            <Link to="/brands" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary">All brands <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
            {brands.filter((b) => b.slug !== slug).map((b) => (
              <Link key={b.id} to={`/brand/${b.slug}`} className="surface flex h-24 items-center justify-center p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                {b.logo_url ? <img src={b.logo_url} alt={b.name} className="max-h-12 max-w-[70%] object-contain" loading="lazy" /> : <span className="font-display text-xl font-extrabold text-ink-soft">{b.name}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BrandPage;
