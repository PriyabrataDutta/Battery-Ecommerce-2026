import { useRef, useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Upload,
  Loader2,
  Car,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Info,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { parseProductsXlsx } from "@/lib/parseProductsXlsx";
import * as XLSX from "xlsx";

/* ─── helpers ─── */
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Generate & download a sample Excel file showing expected format */
function downloadExampleFile(format: "xlsx" | "csv" = "xlsx") {
  const sampleData = [
    ["Car Brand", "Car Model"],
    ["Maruti Suzuki", "Swift"],
    ["Maruti Suzuki", "Swift Dzire"],
    ["Maruti Suzuki", "Baleno"],
    ["Hyundai", "i20"],
    ["Hyundai", "Creta"],
    ["Hyundai", "Venue"],
    ["Tata", "Nexon"],
    ["Tata", "Punch"],
    ["Honda", "City"],
    ["Honda", "Amaze"],
  ];
  if (format === "csv") {
    const csv = sampleData.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "car_brands_models_example.csv";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws["!cols"] = [{ wch: 20 }, { wch: 25 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Car Brands & Models");
  XLSX.writeFile(wb, "car_brands_models_example.xlsx");
}

/** Parse an uploaded brands/models file (xlsx/xls/csv) into [{brand, model}] */
function parseBrandsModelsFile(file: File): Promise<{ brand: string; model: string }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let rows: any[][];
        const isCsv = file.name.toLowerCase().endsWith(".csv");

        if (isCsv) {
          const text = new TextDecoder().decode(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(text, { type: "string" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        } else {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        }

        const result: { brand: string; model: string }[] = [];
        let lastBrand = "";

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const brand = String(row[0] ?? "").trim();
          const model = String(row[1] ?? "").trim();

          if (brand) lastBrand = brand;
          if (!model || !lastBrand) continue;

          result.push({ brand: lastBrand, model });
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/* ─── Brands & Models Tab ─── */
interface ImportPreview {
  parsed: { brand: string; model: string }[];
  newBrands: string[];
  existingBrands: string[];
  newModels: { brand: string; model: string }[];
  existingModels: { brand: string; model: string }[];
}

type ImportMode = "append" | "strict";

interface ImportProgress {
  phase: "brands" | "models";
  current: number;
  total: number;
  brandsCreated: number;
  brandsUpdated: number;
  modelsCreated: number;
  modelsUpdated: number;
  error?: string;
}

function BrandsModelsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandDrawerOpen, setBrandDrawerOpen] = useState(false);
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelBrandId, setNewModelBrandId] = useState<string | null>(null);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("append");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ["admin-car-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_brands")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: ["admin-car-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_models")
        .select("id, name, slug, car_brand_id")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  /* ── mutations ── */
  const addBrand = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("car_brands").insert({ name, slug: slugify(name) });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-car-brands"] });
      toast.success("Car brand added");
      setBrandDrawerOpen(false);
      setNewBrandName("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-car-brands"] });
      qc.invalidateQueries({ queryKey: ["admin-car-models"] });
      toast.success("Car brand removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addModel = useMutation({
    mutationFn: async ({ name, car_brand_id }: { name: string; car_brand_id: string }) => {
      const { error } = await supabase
        .from("car_models")
        .insert({ name, slug: slugify(name), car_brand_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-car-models"] });
      toast.success("Car model added");
      setModelDrawerOpen(false);
      setNewModelName("");
      setNewModelBrandId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeModel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_models").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-car-models"] });
      toast.success("Car model removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  /* ── bulk import ── */
  /* ── preview step: parse file & compare with DB ── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPreviewing(true);

    try {
      const parsed = await parseBrandsModelsFile(file);
      if (!parsed.length) {
        toast.error("No data found in the file");
        setPreviewing(false);
        return;
      }

      const uniqueBrands = [...new Set(parsed.map((r) => r.brand))];

      const { data: existingBrandsData } = await supabase.from("car_brands").select("id, name");
      const brandMap = new Map<string, string>();
      for (const b of existingBrandsData ?? []) brandMap.set(b.name.toLowerCase(), b.id);

      const newBrands: string[] = [];
      const existingBrands: string[] = [];
      for (const name of uniqueBrands) {
        if (brandMap.has(name.toLowerCase())) {
          existingBrands.push(name);
        } else {
          newBrands.push(name);
        }
      }

      const { data: existingModelsData } = await supabase
        .from("car_models")
        .select("id, name, car_brand_id");
      const modelSet = new Set(
        (existingModelsData ?? []).map((m) => `${m.car_brand_id}|${m.name.toLowerCase()}`)
      );

      const newModels: { brand: string; model: string }[] = [];
      const existingModelsArr: { brand: string; model: string }[] = [];
      const seen = new Set<string>();

      for (const row of parsed) {
        const dedupKey = `${row.brand.toLowerCase()}|${row.model.toLowerCase()}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const brandId = brandMap.get(row.brand.toLowerCase());
        if (brandId) {
          const key = `${brandId}|${row.model.toLowerCase()}`;
          if (modelSet.has(key)) {
            existingModelsArr.push(row);
          } else {
            newModels.push(row);
          }
        } else {
          newModels.push(row);
        }
      }

      setImportPreview({ parsed, newBrands, existingBrands, newModels, existingModels: existingModelsArr });
      setShowImportDialog(false);
    } catch (err: any) {
      toast.error(`Failed to parse file: ${err.message ?? "Unknown error"}`);
    } finally {
      setPreviewing(false);
    }
  };

  /* ── confirm import with progress & retry ── */
  const handleConfirmImport = useCallback(async () => {
    if (!importPreview) return;
    const { parsed } = importPreview;
    const isStrict = importMode === "strict";
    setImporting(true);
    const initProgress: ImportProgress = { phase: "brands", current: 0, total: 0, brandsCreated: 0, brandsUpdated: 0, modelsCreated: 0, modelsUpdated: 0 };
    setImportProgress(initProgress);

    try {
      // --- Phase 1: Brands ---
      const uniqueBrands = [...new Set(parsed.map((r) => r.brand))];
      const { data: existingBrandsData } = await supabase.from("car_brands").select("id, name, slug");
      const brandMap = new Map<string, string>();
      const brandSlugMap = new Map<string, { id: string; name: string }>();
      for (const b of existingBrandsData ?? []) {
        brandMap.set(b.name.toLowerCase(), b.id);
        brandSlugMap.set(b.slug, { id: b.id, name: b.name });
      }

      const brandsToProcess = isStrict ? uniqueBrands : uniqueBrands.filter((n) => !brandMap.has(n.toLowerCase()));
      let brandsCreated = 0;
      let brandsUpdated = 0;

      setImportProgress({ ...initProgress, total: brandsToProcess.length });

      for (let i = 0; i < brandsToProcess.length; i++) {
        const name = brandsToProcess[i];
        const slug = slugify(name);

        if (isStrict) {
          const existing = brandSlugMap.get(slug);
          if (existing) {
            // Update name if it differs (e.g. casing fix)
            if (existing.name !== name) {
              await supabase.from("car_brands").update({ name }).eq("id", existing.id);
              brandsUpdated++;
            }
            brandMap.set(name.toLowerCase(), existing.id);
          } else {
            const { data: ins } = await supabase
              .from("car_brands")
              .insert({ name, slug })
              .select("id")
              .single();
            if (ins) {
              brandMap.set(name.toLowerCase(), ins.id);
              brandsCreated++;
            }
          }
        } else {
          // Append mode — only create new
          if (brandMap.has(name.toLowerCase())) { /* skip */ }
          else {
            const { data: ins, error } = await supabase
              .from("car_brands")
              .insert({ name, slug })
              .select("id")
              .single();
            if (ins) {
              brandMap.set(name.toLowerCase(), ins.id);
              brandsCreated++;
            } else if (error) {
              const { data: ex } = await supabase.from("car_brands").select("id").ilike("name", name).maybeSingle();
              if (ex) brandMap.set(name.toLowerCase(), ex.id);
            }
          }
        }
        setImportProgress((p) => p ? { ...p, current: i + 1, brandsCreated, brandsUpdated } : p);
      }

      // --- Phase 2: Models ---
      const { data: existingModelsData } = await supabase
        .from("car_models")
        .select("id, name, slug, car_brand_id");
      const modelKeyMap = new Map<string, { id: string; name: string }>();
      for (const m of existingModelsData ?? []) {
        modelKeyMap.set(`${m.car_brand_id}|${m.slug}`, { id: m.id, name: m.name });
      }

      // Deduplicate
      const modelsToProcess: { brand: string; model: string }[] = [];
      const seen = new Set<string>();
      for (const row of parsed) {
        const brandId = brandMap.get(row.brand.toLowerCase());
        if (!brandId) continue;
        const slug = slugify(row.model);
        const key = `${brandId}|${slug}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (isStrict) {
          modelsToProcess.push(row);
        } else {
          if (!modelKeyMap.has(key)) modelsToProcess.push(row);
        }
      }

      let modelsCreated = 0;
      let modelsUpdated = 0;
      setImportProgress({ phase: "models", current: 0, total: modelsToProcess.length, brandsCreated, brandsUpdated, modelsCreated: 0, modelsUpdated: 0 });

      for (let i = 0; i < modelsToProcess.length; i++) {
        const row = modelsToProcess[i];
        const brandId = brandMap.get(row.brand.toLowerCase());
        if (!brandId) continue;
        const slug = slugify(row.model);
        const key = `${brandId}|${slug}`;

        if (isStrict) {
          const existing = modelKeyMap.get(key);
          if (existing) {
            if (existing.name !== row.model) {
              await supabase.from("car_models").update({ name: row.model }).eq("id", existing.id);
              modelsUpdated++;
            }
          } else {
            const { error } = await supabase
              .from("car_models")
              .insert({ name: row.model, slug, car_brand_id: brandId });
            if (!error) modelsCreated++;
          }
        } else {
          const { error } = await supabase
            .from("car_models")
            .insert({ name: row.model, slug, car_brand_id: brandId });
          if (!error) modelsCreated++;
        }
        setImportProgress((p) => p ? { ...p, current: i + 1, modelsCreated, modelsUpdated } : p);
      }

      const parts: string[] = [];
      if (brandsCreated) parts.push(`${brandsCreated} brand${brandsCreated !== 1 ? "s" : ""} added`);
      if (brandsUpdated) parts.push(`${brandsUpdated} brand${brandsUpdated !== 1 ? "s" : ""} updated`);
      if (modelsCreated) parts.push(`${modelsCreated} model${modelsCreated !== 1 ? "s" : ""} added`);
      if (modelsUpdated) parts.push(`${modelsUpdated} model${modelsUpdated !== 1 ? "s" : ""} updated`);

      toast.success(
        parts.length ? `Import complete! ${parts.join(", ")}.` : "Import complete — everything was already up to date.",
        { duration: 6000 }
      );
      setImportPreview(null);
      setImportProgress(null);
      qc.invalidateQueries({ queryKey: ["admin-car-brands"] });
      qc.invalidateQueries({ queryKey: ["admin-car-models"] });
    } catch (err: any) {
      console.error("Import failed:", err);
      setImportProgress((p) => p ? { ...p, error: err.message ?? "Unknown error" } : p);
    } finally {
      setImporting(false);
    }
  }, [importPreview, importMode, qc]);

  /* ── export (same format as example file so round-trip works) ── */
  const handleExport = () => {
    const rows: string[][] = [["Car Brand", "Car Model"]];
    const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name));
    for (const brand of sortedBrands) {
      const brandModels = models
        .filter((m) => m.car_brand_id === brand.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      for (const model of brandModels) {
        rows.push([brand.name, model.name]);
      }
    }
    if (rows.length === 1) {
      toast.error("No brands with models to export");
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Car Brands & Models");
    XLSX.writeFile(wb, "car_brands_models_export.xlsx");
    toast.success("Exported successfully");
  };

  const filteredBrands = search
    ? brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    : brands;

  const modelsForBrand = (brandId: string) => models.filter((m) => m.car_brand_id === brandId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={brands.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {importing ? "Importing…" : "Import"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setModelDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Model
          </Button>
          <Button size="sm" onClick={() => setBrandDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Brand
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{brands.length} brand{brands.length !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>{models.length} model{models.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Brand list */}
      <div className="rounded-lg border bg-card divide-y">
        {brandsLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">Loading…</div>
        ) : filteredBrands.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">No car brands found</div>
        ) : (
          filteredBrands.map((brand) => {
            const isExpanded = expandedBrand === brand.id;
            const brandModels = modelsForBrand(brand.id);
            return (
              <div key={brand.id}>
                <div
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedBrand(isExpanded ? null : brand.id)}
                >
                  <ChevronRight
                    className={`h-4 w-4 mr-2 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium flex-1">{brand.name}</span>
                  <span className="text-xs text-muted-foreground mr-3">
                    {brandModels.length} model{brandModels.length !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (brandModels.length > 0) {
                        toast.error("Remove all models first before deleting this brand");
                        return;
                      }
                      removeBrand.mutate(brand.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {isExpanded && (
                  <div className="bg-muted/30 border-t">
                    {brandModels.length === 0 ? (
                      <div className="px-8 py-3 text-sm text-muted-foreground">No models yet</div>
                    ) : (
                      brandModels.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center px-8 py-2 border-b last:border-0 hover:bg-muted/50"
                        >
                          <span className="flex-1 text-sm">{model.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeModel.mutate(model.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                    <div className="px-8 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setNewModelBrandId(brand.id);
                          setModelDrawerOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add model to {brand.name}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Import Dialog with instructions */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import Car Brands & Models
            </DialogTitle>
            <DialogDescription>
              Bulk import car brands and their models from an Excel file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary" /> File Format Instructions
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Your Excel file must have <strong>2 columns</strong>:</p>
                <div className="rounded border bg-card overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left px-3 py-2 font-semibold">Car Brand</th>
                        <th className="text-left px-3 py-2 font-semibold">Car Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-3 py-1.5">Maruti Suzuki</td>
                        <td className="px-3 py-1.5">Swift</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-1.5">Maruti Suzuki</td>
                        <td className="px-3 py-1.5">Swift Dzire</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5">Hyundai</td>
                        <td className="px-3 py-1.5">i20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>First row should be the header (<strong>Car Brand</strong>, <strong>Car Model</strong>)</li>
                  <li>If brand column is empty, the model inherits the last brand above it</li>
                  <li>Duplicates are automatically skipped — safe to re-import</li>
                  <li>Supports <code>.xlsx</code>, <code>.xls</code>, and <code>.csv</code> files</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => downloadExampleFile("xlsx")}>
                  <Download className="h-4 w-4 mr-1.5" /> Example (.xlsx)
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => downloadExampleFile("csv")}>
                  <Download className="h-4 w-4 mr-1.5" /> Example (.csv)
                </Button>
              </div>
              <Button
                className="flex-1"
                onClick={() => fileRef.current?.click()}
                disabled={previewing}
              >
                {previewing ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                {previewing ? "Analyzing…" : "Choose File"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog open={!!importPreview} onOpenChange={(open) => { if (!open) setImportPreview(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review what will be imported before confirming.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{importPreview.newBrands.length}</div>
                  <div className="text-xs text-muted-foreground">New Brands</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{importPreview.newModels.length}</div>
                  <div className="text-xs text-muted-foreground">New Models</div>
                </div>
              </div>

              {importPreview.existingBrands.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {importPreview.existingBrands.length} brand{importPreview.existingBrands.length !== 1 ? "s" : ""} already exist and will be skipped.
                </div>
              )}
              {importPreview.existingModels.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {importPreview.existingModels.length} model{importPreview.existingModels.length !== 1 ? "s" : ""} already exist and will be skipped.
                </div>
              )}

              {/* New brands list */}
              {importPreview.newBrands.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold">New Brands</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {importPreview.newBrands.map((b) => (
                      <span key={b} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* New models list */}
              {importPreview.newModels.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold">New Models</h4>
                  <div className="rounded border bg-card max-h-48 overflow-y-auto divide-y text-xs">
                    {importPreview.newModels.slice(0, 100).map((m, i) => (
                      <div key={i} className="flex px-3 py-1.5">
                        <span className="text-muted-foreground w-1/3 truncate">{m.brand}</span>
                        <span className="flex-1">{m.model}</span>
                      </div>
                    ))}
                    {importPreview.newModels.length > 100 && (
                      <div className="px-3 py-1.5 text-muted-foreground text-center">
                        …and {importPreview.newModels.length - 100} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importPreview.newBrands.length === 0 && importPreview.newModels.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Everything in this file already exists. Nothing new to import.
                </div>
              )}

              {/* Progress indicator */}
              {importProgress && !importProgress.error && importing && (
                <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">
                      {importProgress.phase === "brands" ? "Creating brands…" : "Creating models…"}
                    </span>
                    <span className="text-muted-foreground">
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: importProgress.total > 0
                          ? `${Math.round((importProgress.current / importProgress.total) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{importProgress.brandsCreated} brand{importProgress.brandsCreated !== 1 ? "s" : ""} added</span>
                    <span>•</span>
                    <span>{importProgress.modelsCreated} model{importProgress.modelsCreated !== 1 ? "s" : ""} added</span>
                  </div>
                </div>
              )}

              {/* Error with retry */}
              {importProgress?.error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">Import failed</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{importProgress.error}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {importProgress.brandsCreated} brand{importProgress.brandsCreated !== 1 ? "s" : ""} and {importProgress.modelsCreated} model{importProgress.modelsCreated !== 1 ? "s" : ""} were added before the error. Retrying will skip already-created items.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setImportPreview(null); setImportProgress(null); }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                {importProgress?.error ? (
                  <Button className="flex-1" onClick={() => { setImportProgress(null); handleConfirmImport(); }}>
                    <RotateCcw className="h-4 w-4 mr-1.5" /> Retry Import
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleConfirmImport}
                    disabled={importing || (importPreview.newBrands.length === 0 && importPreview.newModels.length === 0)}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1.5" />
                    )}
                    {importing ? "Importing…" : "Confirm Import"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Brand Drawer */}
      <EntityDrawer
        open={brandDrawerOpen}
        onOpenChange={setBrandDrawerOpen}
        title="Add Car Brand"
        description="Create a new car brand."
        saveLabel="Add"
        saving={addBrand.isPending}
        onSave={() => {
          if (!newBrandName.trim()) {
            toast.error("Enter a brand name");
            return;
          }
          addBrand.mutate(newBrandName.trim());
        }}
      >
        <div className="space-y-2">
          <Label className="text-xs">Brand Name</Label>
          <Input
            placeholder="e.g. Maruti Suzuki"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
        </div>
      </EntityDrawer>

      {/* Add Model Drawer */}
      <EntityDrawer
        open={modelDrawerOpen}
        onOpenChange={(open) => {
          setModelDrawerOpen(open);
          if (!open) setNewModelBrandId(null);
        }}
        title="Add Car Model"
        description="Create a new car model under a brand."
        saveLabel="Add"
        saving={addModel.isPending}
        onSave={() => {
          if (!newModelName.trim()) {
            toast.error("Enter a model name");
            return;
          }
          if (!newModelBrandId) {
            toast.error("Select a car brand");
            return;
          }
          addModel.mutate({ name: newModelName.trim(), car_brand_id: newModelBrandId });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Car Brand</Label>
            <Select value={newModelBrandId ?? ""} onValueChange={setNewModelBrandId}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Model Name</Label>
            <Input
              placeholder="e.g. Swift Dzire"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
            />
          </div>
        </div>
      </EntityDrawer>
    </div>
  );
}

/* ─── Product Fitment Tab ─── */
interface FitmentRow {
  product_id: string;
  car_model_id: string;
  product_name?: string;
  product_sku?: string;
  car_brand_name?: string;
  car_model_name?: string;
}

function ProductFitmentTab() {
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
      qc.invalidateQueries({ queryKey: ["admin-fitment"] });
      qc.invalidateQueries({ queryKey: ["admin-fitment-products"] });
      qc.invalidateQueries({ queryKey: ["admin-fitment-models"] });
      qc.invalidateQueries({ queryKey: ["admin-car-brands"] });
      qc.invalidateQueries({ queryKey: ["admin-car-models"] });
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
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileImport} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
            {importing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}
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

/* ─── Main Panel with Tabs ─── */
export default function FitmentPanel() {
  return (
    <Tabs defaultValue="brands-models" className="space-y-4">
      <TabsList>
        <TabsTrigger value="brands-models">Brands & Models</TabsTrigger>
        <TabsTrigger value="product-fitment">Product Fitment</TabsTrigger>
      </TabsList>
      <TabsContent value="brands-models">
        <BrandsModelsTab />
      </TabsContent>
      <TabsContent value="product-fitment">
        <ProductFitmentTab />
      </TabsContent>
    </Tabs>
  );
}
