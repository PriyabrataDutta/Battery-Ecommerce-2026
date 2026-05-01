import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import {
  useCarBrandNameBySlug,
  useCarModelNameBySlug,
  useBatteryBrandNameBySlug,
  useCarBrandNameMap,
} from "@/hooks/queries/useBrands";

type Chip = {
  key: string;
  label: string;
  remove: () => void;
};

interface Props {
  priceBounds?: { min: number; max: number };
}

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function ActiveFilters({ priceBounds }: Props) {
  const [params, setParams] = useSearchParams();

  const carBrandSlug = params.get("car_brand") ?? "";
  const carModelSlug = params.get("car_model") ?? "";
  const batteryBrandSlug = params.get("battery_brand") ?? "";
  const carBrandsCsv = params.get("car_brands") ?? "";
  const carBrandSlugs = useMemo(
    () => carBrandsCsv.split(",").map((s) => s.trim()).filter(Boolean),
    [carBrandsCsv]
  );
  const minPriceParam = params.get("min_price");
  const maxPriceParam = params.get("max_price");

  // Resolve slug -> display name for whatever is currently selected
  const { data: carBrandName } = useCarBrandNameBySlug(carBrandSlug || undefined);
  const { data: carModelName } = useCarModelNameBySlug(carModelSlug || undefined);
  const { data: batteryBrandName } = useBatteryBrandNameBySlug(batteryBrandSlug || undefined);
  const { data: carBrandsNameMap = {} } = useCarBrandNameMap(carBrandSlugs);

  const update = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    });
    setParams(p, { replace: false });
  };

  const minBound = priceBounds?.min;
  const maxBound = priceBounds?.max;
  const priceActive =
    !!priceBounds &&
    ((minPriceParam !== null && Number(minPriceParam) > (minBound ?? 0)) ||
      (maxPriceParam !== null && Number(maxPriceParam) < (maxBound ?? 0)));

  const chips: Chip[] = [];

  if (carBrandSlug) {
    chips.push({
      key: "car_brand",
      label: `Car: ${carBrandName ?? carBrandSlug}`,
      // Removing the dropdown-selected car brand should also clear the dependent model
      remove: () => update({ car_brand: null, car_model: null }),
    });
  }
  if (carModelSlug) {
    chips.push({
      key: "car_model",
      label: `Model: ${carModelName ?? carModelSlug}`,
      remove: () => update({ car_model: null }),
    });
  }
  if (batteryBrandSlug) {
    chips.push({
      key: "battery_brand",
      label: `Battery: ${batteryBrandName ?? batteryBrandSlug}`,
      remove: () => update({ battery_brand: null }),
    });
  }
  carBrandSlugs.forEach((slug) => {
    chips.push({
      key: `car_brands_${slug}`,
      label: carBrandsNameMap[slug] ?? slug,
      remove: () => {
        const next = carBrandSlugs.filter((s) => s !== slug);
        update({ car_brands: next.length ? next.join(",") : null });
      },
    });
  });
  if (priceActive) {
    const lo = minPriceParam !== null ? Number(minPriceParam) : (minBound ?? 0);
    const hi = maxPriceParam !== null ? Number(maxPriceParam) : (maxBound ?? 0);
    chips.push({
      key: "price",
      label: `Price: ${fmtINR(lo)} – ${fmtINR(hi)}`,
      remove: () => update({ min_price: null, max_price: null }),
    });
  }

  if (chips.length === 0) return null;

  const clearAll = () =>
    update({
      car_brand: null,
      car_model: null,
      battery_brand: null,
      car_brands: null,
      min_price: null,
      max_price: null,
    });

  return (
    <div className="bg-white border border-line p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider font-display font-bold text-muted-foreground mr-1">
        Active filters
      </span>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-line bg-muted/40 hover:border-primary hover:text-primary transition-colors"
          aria-label={`Remove filter ${c.label}`}
        >
          <span>{c.label}</span>
          <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="ml-auto text-[11px] text-primary hover:underline font-medium"
      >
        Clear all
      </button>
    </div>
  );
}
