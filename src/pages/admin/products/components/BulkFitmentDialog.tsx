import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FitmentEditor } from "./FitmentEditor";
import { getProductFitmentModelIds, saveProductFitment } from "@/api/admin/productFitment";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BulkFitmentDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>("");
  const [fitmentModelIds, setFitmentModelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch all active products for the picker
  const { data: products = [] } = useQuery({
    queryKey: ["products_for_fitment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; sku: string }[];
    },
    enabled: open,
  });

  // Load existing fitment when product changes
  const { data: existingFitment, isFetching } = useQuery({
    queryKey: ["product_fitment", productId],
    queryFn: () => getProductFitmentModelIds(productId),
    enabled: !!productId && open,
  });

  // Sync existing fitment into local state
  const [lastLoadedProduct, setLastLoadedProduct] = useState("");
  if (existingFitment && productId !== lastLoadedProduct) {
    setFitmentModelIds(existingFitment);
    setLastLoadedProduct(productId);
  }

  const handleProductChange = (id: string) => {
    setProductId(id);
    setLastLoadedProduct(""); // force reload
    setFitmentModelIds([]);
  };

  const handleSave = async () => {
    if (!productId) return;
    setSaving(true);
    try {
      await saveProductFitment(productId, fitmentModelIds);
      toast.success("Fitment saved");
      qc.invalidateQueries({ queryKey: ["product_fitment", productId] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save fitment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Car Fitment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Select Product
            </label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choose a product…" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 max-h-64">
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productId && (
            <>
              {isFetching ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading fitment…
                </div>
              ) : (
                <FitmentEditor
                  selectedModelIds={fitmentModelIds}
                  onChange={setFitmentModelIds}
                />
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Fitment ({fitmentModelIds.length} models)
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
