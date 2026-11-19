import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Car, CheckCircle2, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductFitment } from "@/api/productFitment";

/** "Does it fit my car?" — picks brand → model from this product's own fitment plus all brands. */
export function FitChecker({ fitment, allBrands }: { fitment: ProductFitment[]; allBrands: { slug: string; name: string }[] }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const fitsModels = useMemo(() => fitment.filter((f) => f.brand.slug === brand), [fitment, brand]);
  const brandName = allBrands.find((b) => b.slug === brand)?.name;
  const picked = fitsModels.find((m) => m.slug === model);

  return (
    <div className="rounded-2xl border border-line bg-muted/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 font-display font-bold text-ink">
        <Car className="h-4 w-4 text-primary" /> Does it fit my car?
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(""); }}>
          <SelectTrigger aria-label="Your car brand" className="h-11 rounded-xl border-line bg-white"><SelectValue placeholder="Car brand" /></SelectTrigger>
          <SelectContent className="z-50 max-h-72 bg-white">
            {allBrands.map((b) => <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={setModel} disabled={!brand || fitsModels.length === 0}>
          <SelectTrigger aria-label="Your car model" className="h-11 rounded-xl border-line bg-white"><SelectValue placeholder="Model" /></SelectTrigger>
          <SelectContent className="z-50 max-h-72 bg-white">
            {fitsModels.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}{m.years ? ` (${m.years})` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {brand && (fitsModels.length === 0 ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-ink">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>Not listed for {brandName} cars. <Link to={`/shop/car-batteries?car_brand=${brand}`} className="font-semibold text-primary underline-offset-4 hover:underline">See batteries that fit {brandName}</Link></span>
        </p>
      ) : picked ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" /> Fits your {brandName} {picked.name}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Fits {fitsModels.length} {brandName} model{fitsModels.length === 1 ? "" : "s"}. Pick yours to confirm.</p>
      ))}
    </div>
  );
}
