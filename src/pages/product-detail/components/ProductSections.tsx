/**
 * ProductSections — below-the-fold tabs:
 * Overview · Specifications · Compatible cars · Warranty & delivery · Reviews.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Car, Recycle, RotateCcw, ShieldCheck, Truck, Wrench } from "lucide-react";
import { ProductReviewsSection } from "@/components/reviews/ProductReviewsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProductFitment } from "@/api/productFitment";
import type { Product } from "@/types/catalog";

const BRANDS_SHOWN = 4;

export const ProductSections = ({ product, fitment }: { product: Product; fitment: ProductFitment[] }) => {
  const [showAllFits, setShowAllFits] = useState(false);
  const byBrand = useMemo(() => {
    const m = new Map<string, { brand: ProductFitment["brand"]; models: ProductFitment[] }>();
    for (const f of fitment) {
      const e = m.get(f.brand.slug) ?? { brand: f.brand, models: [] };
      e.models.push(f);
      m.set(f.brand.slug, e);
    }
    return [...m.values()];
  }, [fitment]);

  const specs: [string, string][] = [
    ["Brand", product.battery_brands?.name ?? "—"],
    ["Item code / SKU", product.sku],
    ...(product.categories?.name ? [["Type", product.categories.name] as [string, string]] : []),
    ...(product.capacity_ah ? [["Capacity", `${product.capacity_ah} Ah`] as [string, string]] : []),
    ...(product.warranty_months ? [["Warranty", `${product.warranty_months} months`] as [string, string]] : []),
    ...Object.entries(product.specs ?? {}).map(([k, v]) => [k.replace(/_/g, " "), String(v)] as [string, string]),
  ];

  const nav = [
    ["overview", "Overview"],
    ["specs", "Specifications"],
    ...(byBrand.length ? [["fits", `Compatible cars (${fitment.length})`]] : []),
    ["warranty", "Warranty & delivery"],
    ["reviews", "Reviews"],
  ];

  return (
    <Tabs defaultValue="overview" className="mt-14 sm:mt-20">
      <TabsList aria-label="Product details" className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-full border border-line bg-white p-1.5 shadow-card scrollbar-none sm:w-fit">
        {nav.map(([id, label]) => (
          <TabsTrigger key={id} value={id} className="shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold text-ink/65 data-[state=active]:bg-ink data-[state=active]:text-white data-[state=active]:shadow-none">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

          <TabsContent value="overview" className="mt-6 max-w-4xl focus-visible:outline-none">
            <h2 className="sr-only">Overview</h2>
            <div className="surface prose prose-sm max-w-none p-6 text-ink-soft sm:p-8 sm:text-[15px]">
              {product.description || product.short_description || "Genuine battery with full manufacturer warranty."}
            </div>
          </TabsContent>
          <TabsContent value="specs" className="mt-6 max-w-4xl focus-visible:outline-none">
            <h2 className="sr-only">Specifications</h2>
            <dl className="surface divide-y divide-line overflow-hidden">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[1fr_1.2fr] gap-4 px-5 py-3.5 text-sm">
                  <dt className="capitalize text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
          {byBrand.length > 0 && (
            <TabsContent value="fits" className="mt-6 max-w-4xl focus-visible:outline-none">
            <h2 className="sr-only">Compatible cars</h2>
              <p className="mb-4 text-sm text-muted-foreground">This battery is listed for {fitment.length} model{fitment.length === 1 ? "" : "s"} from {byBrand.length} brand{byBrand.length === 1 ? "" : "s"}.</p>
              <div className="space-y-3">
                {(showAllFits ? byBrand : byBrand.slice(0, BRANDS_SHOWN)).map(({ brand, models }) => (
                  <div key={brand.slug} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <Link to={`/shop/car-batteries?car_brand=${brand.slug}`} className="flex w-40 shrink-0 items-center gap-2.5 font-display font-bold text-ink hover:text-primary">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted">
                        {brand.logo_url ? <img src={brand.logo_url} alt="" className="h-6 w-7 object-contain" loading="lazy" /> : <Car className="h-4 w-4" />}
                      </span>
                      {brand.name}
                    </Link>
                    <div className="flex flex-wrap gap-1.5">
                      {models.map((m) => (
                        <Link key={m.id} to={`/shop/car-batteries?car_brand=${brand.slug}&car_model=${m.slug}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-ink hover:border-ink">
                          {m.name}{m.years ? <span className="text-muted-foreground"> · {m.years}</span> : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {byBrand.length > BRANDS_SHOWN && (
                <button type="button" onClick={() => setShowAllFits((v) => !v)} aria-expanded={showAllFits}
                  className="mt-4 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink">
                  {showAllFits ? "Show fewer brands" : `Show all ${byBrand.length} brands`}
                </button>
              )}
            </TabsContent>
          )}
          <TabsContent value="warranty" className="mt-6 max-w-4xl focus-visible:outline-none">
            <h2 className="sr-only">Warranty & delivery</h2>
            <ul className="surface divide-y divide-line">
              {[
                { Icon: ShieldCheck, t: `${product.warranty_months ?? 0} months manufacturer warranty`, s: "Covers manufacturing defects. Claims at the brand's authorised service centres; we help you raise them." },
                { Icon: BadgeCheck, t: "Genuine product", s: "Sourced through authorised distribution, with invoice." },
                { Icon: Truck, t: "Free standard delivery", s: "3–5 business days. Express 1–2 days for ₹299." },
                { Icon: Wrench, t: "Doorstep installation · ₹499", s: "Includes old battery pickup. Choose it at checkout." },
                { Icon: Recycle, t: "Old battery exchange", s: "Recycled as required by the Battery Waste Management Rules, 2022." },
                { Icon: RotateCcw, t: "7-day returns", s: "Unused, uninstalled batteries in original packaging." },
              ].map(({ Icon, t, s }) => (
                <li key={t} className="flex gap-3.5 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{t}</span>
                    <span className="block text-[13px] text-muted-foreground">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/refund-policy" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Read the return & refund policy</Link>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6 max-w-4xl focus-visible:outline-none">
            <h2 className="sr-only">Reviews</h2>
            <ProductReviewsSection productId={product.id} />
          </TabsContent>
    </Tabs>
  );
};
