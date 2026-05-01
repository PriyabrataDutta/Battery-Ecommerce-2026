import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BatteryBrand, Category } from "@/types/catalog";
import { PRODUCT_STATUSES } from "../lib/constants";

/**
 * ProductsToolbar
 * --------------------------------------------------------------
 * Search + filter row above the products table. Uncontrolled-
 * style: emits new option objects to the parent which owns the
 * filter state.
 */
export interface ProductsFilterState {
  search: string;
  status: string;
  brandId: string;
  categoryId: string;
  lowStockOnly: boolean;
}

export function ProductsToolbar({
  state,
  onChange,
  onCreate,
  onMapFitment,
  brands,
  categories,
  count,
}: {
  state: ProductsFilterState;
  onChange: (next: ProductsFilterState) => void;
  onCreate: () => void;
  onMapFitment?: () => void;
  brands: BatteryBrand[];
  categories: Category[];
  count: number;
}) {
  const set = <K extends keyof ProductsFilterState>(k: K, v: ProductsFilterState[K]) =>
    onChange({ ...state, [k]: v });

  const hasFilters =
    state.search || state.status || state.brandId || state.categoryId || state.lowStockOnly;

  return (
    <div className="bg-card border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search by name or SKU"
          className="pl-8 h-9 text-sm"
        />
      </div>

      <FilterSelect
        value={state.status}
        onChange={(v) => set("status", v)}
        placeholder="All statuses"
        options={PRODUCT_STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <FilterSelect
        value={state.brandId}
        onChange={(v) => set("brandId", v)}
        placeholder="All brands"
        options={brands.map((b) => ({ value: b.id, label: b.name }))}
      />
      <FilterSelect
        value={state.categoryId}
        onChange={(v) => set("categoryId", v)}
        placeholder="All categories"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />

      <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground select-none px-2">
        <input
          type="checkbox"
          checked={state.lowStockOnly}
          onChange={(e) => set("lowStockOnly", e.target.checked)}
          className="rounded border-line"
        />
        Low stock only
      </label>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ search: "", status: "", brandId: "", categoryId: "", lowStockOnly: false })
          }
        >
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}

      <span className="text-xs text-muted-foreground ml-auto">{count} results</span>
      {onMapFitment && (
        <Button size="sm" variant="outline" onClick={onMapFitment}>
          Map Fitment
        </Button>
      )}
      <Button size="sm" onClick={onCreate}>
        New product
      </Button>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value || "__all"} onValueChange={(v) => onChange(v === "__all" ? "" : v)}>
      <SelectTrigger className="h-9 w-[160px] text-xs capitalize">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all" className="text-xs">
          {placeholder}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs capitalize">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
