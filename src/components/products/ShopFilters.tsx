import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import type { CarBrand, CarModel, BatteryBrand } from "@/types/catalog";

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

  const { data: carBrands = [] } = useQuery({
    queryKey: ["car_brands_filter"],
    queryFn: async (): Promise<CarBrand[]> => {
      const { data, error } = await supabase.from("car_brands").select("*").order("sort_order");
      if (error) throw error;
      return data as CarBrand[];
    },
  });

  const currentCarBrand = useMemo(
    () => carBrands.find((b) => b.slug === carBrandSlug) ?? null,
    [carBrands, carBrandSlug]
  );

  // Models depend on selected car brand
  const { data: carModels = [] } = useQuery({
    queryKey: ["car_models_filter", currentCarBrand?.id],
    enabled: !!currentCarBrand?.id,
    queryFn: async (): Promise<CarModel[]> => {
      const { data, error } = await supabase
        .from("car_models")
        .select("*")
        .eq("car_brand_id", currentCarBrand!.id)
        .order("name");
      if (error) throw error;
      return data as CarModel[];
    },
  });

  const { data: batteryBrands = [] } = useQuery({
    queryKey: ["battery_brands_filter"],
    queryFn: async (): Promise<BatteryBrand[]> => {
      const { data, error } = await supabase.from("battery_brands").select("*").order("sort_order");
      if (error) throw error;
      return data as BatteryBrand[];
    },
  });

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
  const minPriceParam = params.get("min_price");
  const maxPriceParam = params.get("max_price");
  const urlMin = minPriceParam !== null ? Number(minPriceParam) : minBound;
  const urlMax = maxPriceParam !== null ? Number(maxPriceParam) : maxBound;

  const [range, setRange] = useState<[number, number]>([urlMin, urlMax]);
  // Sync local state when URL or bounds change externally
  useEffect(() => {
    setRange([urlMin, urlMax]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMin, urlMax, minBound, maxBound]);

  const commitPrice = (vals: [number, number]) => {
    const [lo, hi] = vals;
    const p = new URLSearchParams(params);
    if (lo > minBound) p.set("min_price", String(lo)); else p.delete("min_price");
    if (hi < maxBound) p.set("max_price", String(hi)); else p.delete("max_price");
    setParams(p, { replace: true });
  };

  const priceActive = urlMin !== minBound || urlMax !== maxBound;
  const hasAny = !!(carBrandSlug || carModelSlug || batteryBrandSlug || priceActive);

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

      {priceBounds && maxBound > minBound && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Price Range
            </h3>
            {priceActive && (
              <button
                type="button"
                onClick={() => update({ min_price: null, max_price: null })}
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
            value={range}
            onValueChange={(v) => {
              const next: [number, number] = [v[0], v[1]];
              setRange(next);
              commitPrice(next);
            }}
            className="my-3"
          />
          <div className="flex items-center justify-between text-xs text-ink font-medium">
            <span>{fmt(range[0])}</span>
            <span>{fmt(range[1])}</span>
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
