import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Car } from "lucide-react";
import type { CarBrand, CarModel } from "@/types/catalog";

interface Props {
  selectedModelIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Inline fitment picker: choose a car brand → see its models as checkboxes → add.
 * Displays selected models grouped by brand as removable chips.
 */
export function FitmentEditor({ selectedModelIds, onChange }: Props) {
  const [brandId, setBrandId] = useState<string>("");

  const { data: brands = [] } = useQuery({
    queryKey: ["car_brands_all"],
    queryFn: async (): Promise<CarBrand[]> => {
      const { data, error } = await supabase.from("car_brands").select("*").order("name");
      if (error) throw error;
      return data as CarBrand[];
    },
    staleTime: 60_000,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["car_models_by_brand", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<CarModel[]> => {
      const { data, error } = await supabase
        .from("car_models")
        .select("*")
        .eq("car_brand_id", brandId)
        .order("name");
      if (error) throw error;
      return data as CarModel[];
    },
  });

  // Fetch all models that are selected (for chip display, we need brand info)
  const { data: allSelectedModels = [] } = useQuery({
    queryKey: ["car_models_selected", selectedModelIds],
    enabled: selectedModelIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_models")
        .select("id, name, car_brand_id")
        .in("id", selectedModelIds);
      if (error) throw error;
      return data as { id: string; name: string; car_brand_id: string }[];
    },
  });

  const selected = new Set(selectedModelIds);

  const toggleModel = (modelId: string) => {
    const next = new Set(selected);
    if (next.has(modelId)) next.delete(modelId);
    else next.add(modelId);
    onChange(Array.from(next));
  };

  const removeModel = (modelId: string) => {
    onChange(selectedModelIds.filter((id) => id !== modelId));
  };

  // Group selected models by brand for chip display
  const groupedChips = useMemo(() => {
    const brandMap = new Map<string, { brandName: string; models: { id: string; name: string }[] }>();
    for (const m of allSelectedModels) {
      const brand = brands.find((b) => b.id === m.car_brand_id);
      const brandName = brand?.name ?? "Unknown";
      if (!brandMap.has(m.car_brand_id)) {
        brandMap.set(m.car_brand_id, { brandName, models: [] });
      }
      brandMap.get(m.car_brand_id)!.models.push({ id: m.id, name: m.name });
    }
    return Array.from(brandMap.values()).sort((a, b) => a.brandName.localeCompare(b.brandName));
  }, [allSelectedModels, brands]);

  return (
    <div className="space-y-3">
      {/* Brand selector + model checkboxes */}
      <div className="space-y-2">
        <Select value={brandId} onValueChange={setBrandId}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select car brand…" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 max-h-64">
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {brandId && models.length > 0 && (
          <div className="border border-line rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                {models.length} models
              </span>
              <button
                type="button"
                className="text-[11px] text-primary hover:underline"
                onClick={() => {
                  const allIds = models.map((m) => m.id);
                  const allSelected = allIds.every((id) => selected.has(id));
                  if (allSelected) {
                    onChange(selectedModelIds.filter((id) => !allIds.includes(id)));
                  } else {
                    const merged = new Set([...selectedModelIds, ...allIds]);
                    onChange(Array.from(merged));
                  }
                }}
              >
                {models.every((m) => selected.has(m.id)) ? "Deselect all" : "Select all"}
              </button>
            </div>
            {models.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 px-1 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded"
              >
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={() => toggleModel(m.id)}
                />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        )}

        {brandId && models.length === 0 && (
          <p className="text-xs text-muted-foreground px-1">No models found for this brand.</p>
        )}
      </div>

      {/* Selected chips */}
      {groupedChips.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">
            {selectedModelIds.length} model{selectedModelIds.length !== 1 ? "s" : ""} selected
          </p>
          {groupedChips.map((group) => (
            <div key={group.brandName}>
              <p className="text-[11px] font-bold text-ink mb-1">{group.brandName}</p>
              <div className="flex flex-wrap gap-1">
                {group.models.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] rounded-full"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => removeModel(m.id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedModelIds.length === 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5" /> No car models mapped yet
        </p>
      )}
    </div>
  );
}
