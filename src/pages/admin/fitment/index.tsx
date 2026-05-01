import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { toast } from "sonner";
import { Plus, Search, Trash2, Upload, Loader2 } from "lucide-react";
import { parseProductsXlsx } from "@/lib/parseProductsXlsx";

interface FitmentRow {
  product_id: string;
  car_model_id: string;
  product_name?: string;
  product_sku?: string;
  car_brand_name?: string;
  car_model_name?: string;
}

export default function FitmentPanel() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: fitments = [], isLoading } = useQuery({
    queryKey: ["admin-fitment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_fitment")
        .select("product_id, car_model_id, products(name, sku), car_models(name, car_brands(name))");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        product_id: r.product_id,
        car_model_id: r.car_model_id,
        product_name: r.products?.name ?? "—",
        product_sku: r.products?.sku ?? "",
        car_brand_name: r.car_models?.car_brands?.name ?? "",
        car_model_name: r.car_models?.name ?? "—",
      })) as FitmentRow[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-fitment-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku").order("name");
      return data ?? [];
    },
  });

  const { data: carModels = [] } = useQuery({
    queryKey: ["admin-fitment-models"],
    queryFn: async () => {
      const { data } = await supabase
        .from("car_models")
        .select("id, name, car_brands(name)")
        .order("name");
      return (data ?? []).map((m: any) => ({
        id: m.id,
        label: `${m.car_brands?.name ?? ""} ${m.name}`.trim(),
      }));
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ product_id, car_model_id }: { product_id: string; car_model_id: string }) => {
      const { error } = await supabase.from("product_fitment").insert({ product_id, car_model_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fitment"] });
      toast.success("Fitment added");
      setDrawerOpen(false);
      setSelectedProduct(null);
      setSelectedModel(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ product_id, car_model_id }: { product_id: string; car_model_id: string }) => {
      const { error } = await supabase
        .from("product_fitment")
        .delete()
        .eq("product_id", product_id)
        .eq("car_model_id", car_model_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fitment"] });
      toast.success("Fitment removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected
    e.target.value = "";

    setImporting(true);
    try {
      const parsed = await parseProductsXlsx(file);
      if (!parsed.rows.length) {
        toast.error("No data found in the Excel file");
        return;
      }

      toast.info(
        `Importing ${parsed.rows.length} products, ${parsed.car_brand_count} car brands, ${parsed.car_model_count} models…`,
        { duration: 5000 }
      );

      const { data, error } = await supabase.functions.invoke("bulk-import-fitment", {
        body: { rows: parsed.rows },
      });

      if (error) throw error;

      const s = data as Record<string, number>;
      toast.success(
        `Import complete! ${s.brands_created} brands, ${s.models_created} models, ${s.products_created} products created, ${s.products_updated} updated, ${s.fitments_created} fitments linked.`,
        { duration: 8000 }
      );

      // Refresh all related queries
      qc.invalidateQueries({ queryKey: ["admin-fitment"] });
      qc.invalidateQueries({ queryKey: ["admin-fitment-products"] });
      qc.invalidateQueries({ queryKey: ["admin-fitment-models"] });
    } catch (err: any) {
      console.error("Import failed:", err);
      toast.error(`Import failed: ${err.message ?? "Unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  const filtered = search
    ? fitments.filter(
        (f) =>
          f.product_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.product_sku?.toLowerCase().includes(search.toLowerCase()) ||
          f.car_model_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.car_brand_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : fitments;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fitments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileImport}
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {importing ? "Importing…" : "Import from Excel"}
          </Button>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Fitment
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Car Brand</th>
              <th className="text-left px-4 py-3">Car Model</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No fitments found</td></tr>
            ) : (
              filtered.map((f) => (
                <tr key={`${f.product_id}-${f.car_model_id}`} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{f.product_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.product_sku}</td>
                  <td className="px-4 py-3">{f.car_brand_name}</td>
                  <td className="px-4 py-3">{f.car_model_name}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeMutation.mutate({ product_id: f.product_id, car_model_id: f.car_model_id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Add Fitment"
        description="Link a product to a car model."
        saveLabel="Add"
        saving={addMutation.isPending}
        onSave={() => {
          if (!selectedProduct || !selectedModel) {
            toast.error("Select both product and car model");
            return;
          }
          addMutation.mutate({ product_id: selectedProduct, car_model_id: selectedModel });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Product</Label>
            <Select value={selectedProduct ?? ""} onValueChange={setSelectedProduct}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Car Model</Label>
            <Select value={selectedModel ?? ""} onValueChange={setSelectedModel}>
              <SelectTrigger><SelectValue placeholder="Select car model" /></SelectTrigger>
              <SelectContent>
                {carModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </EntityDrawer>
    </div>
  );
}
