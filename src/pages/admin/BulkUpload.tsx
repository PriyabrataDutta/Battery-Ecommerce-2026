import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { parseProductsXlsx, type ParseResult } from "@/lib/parseProductsXlsx";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const BulkUpload = () => {
  const qc = useQueryClient();
  const [categorySlug, setCategorySlug] = useState("car-batteries");
  const [wipe, setWipe] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: cats = [] } = useQuery({
    queryKey: ["cats-bulk"],
    queryFn: async () => (await supabase.from("categories").select("slug, name").order("sort_order")).data ?? [],
  });

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const result = await parseProductsXlsx(file);
      setParsed(result);
      toast.success(`Parsed ${result.rows.length} products`);
    } catch (e: any) {
      toast.error(`Parse failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const importer = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("Nothing to import");
      const { data, error } = await supabase.functions.invoke("bulk-import-products", {
        body: { category_slug: categorySlug, rows: parsed.rows, wipe },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.upserted_products} products, ${data.fitment_links} fitment links`);
      if (data.errors?.length) toast.warning(`${data.errors.length} rows had warnings — see console`);
      console.log("Import errors:", data.errors);
      qc.invalidateQueries();
      setParsed(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white border border-line p-6 space-y-4">
        <h2 className="font-display font-bold uppercase tracking-wider">1. Choose Target Category</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Select value={categorySlug} onValueChange={setCategorySlug}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                {cats.map((c: any) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={wipe} onCheckedChange={(v) => setWipe(Boolean(v))} />
            Wipe existing products in this category before import
          </label>
        </div>
      </div>

      <div className="bg-white border border-line p-6 space-y-4">
        <h2 className="font-display font-bold uppercase tracking-wider">2. Upload XLSX</h2>
        <p className="text-xs text-muted-foreground">
          Expected columns: <code>Battery Name, Battery Brand, Car Brand, Car Model, With Exchange Price, Without Exchange Price, Warranty</code>
        </p>
        <Input
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
        {busy && <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Parsing…</div>}
      </div>

      {parsed && (
        <div className="bg-white border border-line p-6 space-y-4">
          <h2 className="font-display font-bold uppercase tracking-wider">3. Preview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Stat label="Products" value={parsed.rows.length} />
            <Stat label="Battery Brands" value={parsed.battery_brand_count} />
            <Stat label="Car Brands" value={parsed.car_brand_count} />
            <Stat label="Car Models" value={parsed.car_model_count} />
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Sample (first 5 rows)</div>
          <div className="overflow-x-auto border border-line">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-2 py-1.5">Name</th>
                  <th className="text-left px-2 py-1.5">Brand</th>
                  <th className="text-right px-2 py-1.5">Without Ex.</th>
                  <th className="text-right px-2 py-1.5">With Ex.</th>
                  <th className="text-left px-2 py-1.5">Warranty</th>
                  <th className="text-right px-2 py-1.5">Models</th>
                </tr>
              </thead>
              <tbody>
                {parsed.preview.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1.5">{r.battery_name}</td>
                    <td className="px-2 py-1.5">{r.battery_brand}</td>
                    <td className="px-2 py-1.5 text-right">{r.without_exchange_price ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{r.with_exchange_price ?? "—"}</td>
                    <td className="px-2 py-1.5 truncate max-w-[150px]">{r.warranty_text ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right">{r.car_models.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => importer.mutate()} disabled={importer.isPending}>
              {importer.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Import {parsed.rows.length} Products
            </Button>
            <Button variant="outline" onClick={() => setParsed(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Tip: continuation rows (blank Name with extra Car Brand/Model) are merged into the previous product automatically.
      </div>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-muted/40 border border-line p-3">
      <div className="font-display-tight text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

export default BulkUpload;
