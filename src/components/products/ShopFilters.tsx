import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import {
  useCarBrands,
  useCarModelsByBrandId,
  useBatteryBrands,
} from "@/hooks/queries/useBrands";

type Counts = {
  byBatteryBrand: Record<string, number>; // slug -> count
  total: number;
};

interface Props {
  counts?: Counts;
  priceBounds?: { min: number; max: number };
}

const ALL = "__all__";

export function ShopFilters({ counts, priceBounds }: Props) {
  const [params, setParams] = useSearchParams();

  const carBrandSlug = params.get("car_brand") ?? "";
  const carModelSlug = params.get("car_model") ?? "";
  const batteryBrandSlug = params.get("battery_brand") ?? "";
  const carBrandsCsv = params.get("car_brands") ?? "";
  const selectedCarBrands = useMemo(
    () => new Set(carBrandsCsv.split(",").map((s) => s.trim()).filter(Boolean)),
    [carBrandsCsv]
  );

  const { data: carBrands = [] } = useCarBrands();

  const currentCarBrand = useMemo(
    () => carBrands.find((b) => b.slug === carBrandSlug) ?? null,
    [carBrands, carBrandSlug]
  );

  // Models depend on selected car brand
  const { data: carModels = [] } = useCarModelsByBrandId(currentCarBrand?.id);

  const { data: batteryBrands = [] } = useBatteryBrands();

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    });
    setParams(p, { replace: false });
  };

  const onCarBrandChange = (val: string) => {
    if (val === ALL) {
      update({ car_brand: null, car_model: null });
    } else {
      // Reset model when brand changes
      update({ car_brand: val, car_model: null });
    }
  };

  const onCarModelChange = (val: string) => {
    update({ car_model: val === ALL ? null : val });
  };

  const onBatteryBrandChange = (slug: string | null) => {
    update({ battery_brand: slug });
  };

  // Price range slider — local state for smooth dragging, URL update on commit
  const minBound = priceBounds?.min ?? 0;
  const maxBound = priceBounds?.max ?? 0;
  const boundsReady = !!priceBounds && maxBound > minBound;
  const minPriceParam = params.get("min_price");
  const maxPriceParam = params.get("max_price");
  // Resolve URL values, clamped within current bounds (only meaningful once bounds are ready)
  const clamp = (n: number) => Math.min(maxBound, Math.max(minBound, n));
  const urlMin = boundsReady && minPriceParam !== null ? clamp(Number(minPriceParam)) : minBound;
  const urlMax = boundsReady && maxPriceParam !== null ? clamp(Number(maxPriceParam)) : maxBound;

  // Lazy-init: start as null until bounds load, then mirror the URL exactly.
  const [range, setRange] = useState<[number, number] | null>(null);
  const [hasUserDragged, setHasUserDragged] = useState(false);

  // Re-sync from URL/bounds when they change externally (and on first bounds-ready render).
  useEffect(() => {
    if (!boundsReady) return;
    if (hasUserDragged) return; // don't overwrite an active drag
    setRange([urlMin, urlMax]);
  }, [urlMin, urlMax, boundsReady, hasUserDragged]);

  const displayRange: [number, number] = range ?? [urlMin, urlMax];

  const commitPrice = (vals: [number, number]) => {
    const [lo, hi] = vals;
    const p = new URLSearchParams(params);
    if (lo > minBound) p.set("min_price", String(lo)); else p.delete("min_price");
    if (hi < maxBound) p.set("max_price", String(hi)); else p.delete("max_price");
    setParams(p, { replace: true });
  };

  const priceActive = urlMin !== minBound || urlMax !== maxBound;
  const hasAny = !!(carBrandSlug || carModelSlug || batteryBrandSlug || priceActive || selectedCarBrands.size > 0);

  const toggleCarBrand = (slug: string) => {
    const next = new Set(selectedCarBrands);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    update({ car_brands: next.size > 0 ? Array.from(next).join(",") : null });
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-bold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
          Car Brand
        </h3>
        <Select value={carBrandSlug || ALL} onValueChange={onCarBrandChange}>
          <SelectTrigger className="h-10 border-line">
            <SelectValue placeholder="All car brands" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 max-h-72">
            <SelectItem value={ALL}>All car brands</SelectItem>
            {carBrands.map((b) => (
              <SelectItem key={b.id} value={b.slug}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-display font-bold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
          Car Model
        </h3>
        <Select
          value={carModelSlug || ALL}
          onValueChange={onCarModelChange}
          disabled={!currentCarBrand}
        >
          <SelectTrigger className="h-10 border-line">
            <SelectValue placeholder={currentCarBrand ? "All models" : "Select a car brand first"} />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 max-h-72">
            <SelectItem value={ALL}>All models</SelectItem>
            {carModels.map((m) => (
              <SelectItem key={m.id} value={m.slug}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {boundsReady && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Price Range
            </h3>
            {priceActive && (
              <button
                type="button"
                onClick={() => {
                  setHasUserDragged(false);
                  update({ min_price: null, max_price: null });
                }}
                className="text-[11px] text-primary hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <Slider
            min={minBound}
            max={maxBound}
            step={Math.max(1, Math.round((maxBound - minBound) / 100))}
            value={displayRange}
            onValueChange={(v) => {
              const next: [number, number] = [v[0], v[1]];
              setHasUserDragged(true);
              setRange(next);
              commitPrice(next);
            }}
            onValueCommit={() => setHasUserDragged(false)}
            className="my-3"
          />
          <div className="flex items-center justify-between text-xs text-ink font-medium">
            <span>{fmt(displayRange[0])}</span>
            <span>{fmt(displayRange[1])}</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-bold text-xs uppercase tracking-wider mb-2 text-muted-foreground">
          Battery Brand
        </h3>
        <ul className="space-y-1.5 text-sm">
          <li>
            <button
              type="button"
              onClick={() => onBatteryBrandChange(null)}
              className={`w-full flex items-center justify-between px-3 py-2 border transition-colors ${
                !batteryBrandSlug
                  ? "border-primary text-primary bg-primary/5"
                  : "border-line hover:border-primary hover:text-primary"
              }`}
            >
              <span>All brands</span>
              {counts && <span className="text-xs text-muted-foreground">{counts.total}</span>}
            </button>
          </li>
          {batteryBrands.map((b) => {
            const count = counts?.byBatteryBrand[b.slug] ?? 0;
            const active = batteryBrandSlug === b.slug;
            const disabled = !!counts && count === 0 && !active;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onBatteryBrandChange(b.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 border transition-colors capitalize ${
                    active
                      ? "border-primary text-primary bg-primary/5"
                      : disabled
                      ? "border-line text-muted-foreground/50 cursor-not-allowed"
                      : "border-line hover:border-primary hover:text-primary"
                  }`}
                >
                  <span>{b.name}</span>
                  {counts && <span className="text-xs text-muted-foreground">{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Car Brand
          </h3>
          {selectedCarBrands.size > 0 && (
            <button
              type="button"
              onClick={() => update({ car_brands: null })}
              className="text-[11px] text-primary hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <ul className="space-y-1.5 text-sm max-h-60 overflow-y-auto pr-1">
          {carBrands.map((b) => {
            const checked = selectedCarBrands.has(b.slug);
            return (
              <li key={b.id}>
                <label className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer hover:text-primary transition-colors">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleCarBrand(b.slug)}
                  />
                  <span className="capitalize">{b.name}</span>
                </label>
              </li>
            );
          })}
          {carBrands.length === 0 && (
            <li className="text-xs text-muted-foreground px-2">No car brands available</li>
          )}
        </ul>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full sticky bottom-0"
        disabled={!hasAny}
        onClick={() => {
          // Reset only filter-controlled params; preserve q (search) and type (category)
          update({
            car_brand: null,
            car_model: null,
            battery_brand: null,
            car_brands: null,
            min_price: null,
            max_price: null,
          });
          setRange([minBound, maxBound]);
        }}
      >
        <X className="h-3.5 w-3.5 mr-1.5" /> Clear all filters
      </Button>
    </div>
  );
}
