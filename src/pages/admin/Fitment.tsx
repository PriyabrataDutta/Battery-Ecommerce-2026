import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { logActivity, slugify } from "@/lib/adminLog";
import { Checkbox } from "@/components/ui/checkbox";

const Fitment = () => {
  const [tab, setTab] = useState("models");

  return (
    <div>
      <h2 className="font-display-tight font-bold text-xl mb-4">Car Fitment</h2>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="models">Brands & Models</TabsTrigger>
          <TabsTrigger value="map">Map Products</TabsTrigger>
        </TabsList>
        <TabsContent value="models" className="mt-4"><BrandsModels /></TabsContent>
        <TabsContent value="map" className="mt-4"><MapProducts /></TabsContent>
      </Tabs>
    </div>
  );
};

function BrandsModels() {
  const qc = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState({ name: "", years: "" });
  const [editing, setEditing] = useState<{ id: string; name: string; years: string } | null>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["admin-car-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("car_brands").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: models = [] } = useQuery({
    queryKey: ["admin-car-models", selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      const { data } = await supabase.from("car_models").select("*").eq("car_brand_id", selectedBrand).order("name");
      return data ?? [];
    },
    enabled: !!selectedBrand,
  });

  const addBrand = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("car_brands").insert({ name, slug: slugify(name) });
      if (error) throw error;
      await logActivity("car_brand.create", "car_brand", null, { name });
    },
    onSuccess: () => { setNewBrand(""); qc.invalidateQueries({ queryKey: ["admin-car-brands"] }); toast.success("Brand added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_brands").delete().eq("id", id);
      if (error) throw error;
      await logActivity("car_brand.delete", "car_brand", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-car-brands"] }); if (selectedBrand) setSelectedBrand(null); toast.success("Brand deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const addModel = useMutation({
    mutationFn: async (m: { name: string; years: string }) => {
      if (!selectedBrand) return;
      const { error } = await supabase.from("car_models").insert({
        car_brand_id: selectedBrand,
        name: m.name,
        slug: slugify(m.name),
        years: m.years || null,
      });
      if (error) throw error;
      await logActivity("car_model.create", "car_model", null, m);
    },
    onSuccess: () => { setNewModel({ name: "", years: "" }); qc.invalidateQueries({ queryKey: ["admin-car-models", selectedBrand] }); toast.success("Model added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateModel = useMutation({
    mutationFn: async (m: { id: string; name: string; years: string }) => {
      const { error } = await supabase.from("car_models").update({ name: m.name, years: m.years || null, slug: slugify(m.name) }).eq("id", m.id);
      if (error) throw error;
      await logActivity("car_model.update", "car_model", m.id, m);
    },
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["admin-car-models", selectedBrand] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delModel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_models").delete().eq("id", id);
      if (error) throw error;
      await logActivity("car_model.delete", "car_model", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-car-models", selectedBrand] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-card border border-line rounded-lg p-4">
        <h3 className="font-display-tight font-bold mb-3">Car Brands</h3>
        <div className="flex gap-2 mb-3">
          <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="e.g. Toyota" />
          <Button size="sm" onClick={() => newBrand.trim() && addBrand.mutate(newBrand.trim())}><Plus className="h-4 w-4" /></Button>
        </div>
        <ul className="space-y-1 max-h-[500px] overflow-y-auto">
          {brands.map((b: any) => (
            <li key={b.id} className={`flex items-center justify-between rounded px-2 py-1.5 cursor-pointer ${selectedBrand === b.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`} onClick={() => setSelectedBrand(b.id)}>
              <span className="text-sm">{b.name}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); if (confirm("Delete brand and its models?")) delBrand.mutate(b.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-card border border-line rounded-lg p-4">
        <h3 className="font-display-tight font-bold mb-3">{selectedBrand ? `Models (${models.length})` : "Select a brand"}</h3>
        {selectedBrand && (
          <>
            <div className="grid grid-cols-[1fr_120px_auto] gap-2 mb-3">
              <Input value={newModel.name} onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} placeholder="Model name" />
              <Input value={newModel.years} onChange={(e) => setNewModel({ ...newModel, years: e.target.value })} placeholder="2015-2022" />
              <Button size="sm" onClick={() => newModel.name.trim() && addModel.mutate(newModel)}><Plus className="h-4 w-4" /></Button>
            </div>
            <ul className="space-y-1 max-h-[460px] overflow-y-auto">
              {models.map((m: any) => (
                <li key={m.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted">
                  {editing?.id === m.id ? (
                    <>
                      <Input className="h-7" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                      <Input className="h-7 w-24" value={editing.years} onChange={(e) => setEditing({ ...editing, years: e.target.value })} />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateModel.mutate(editing)}><Save className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground">{m.years ?? ""}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing({ id: m.id, name: m.name, years: m.years ?? "" })}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirm("Delete model?") && delModel.mutate(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function MapProducts() {
  const qc = useQueryClient();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["admin-car-brands"],
    queryFn: async () => (await supabase.from("car_brands").select("*").order("name")).data ?? [],
  });
  const { data: models = [] } = useQuery({
    queryKey: ["admin-car-models", brandId],
    queryFn: async () => brandId ? ((await supabase.from("car_models").select("*").eq("car_brand_id", brandId).order("name")).data ?? []) : [],
    enabled: !!brandId,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-mini"],
    queryFn: async () => (await supabase.from("products").select("id, name, sku").order("name")).data ?? [],
  });
  const { data: mapped = [] } = useQuery({
    queryKey: ["admin-fitment", modelId],
    queryFn: async () => modelId ? ((await supabase.from("product_fitment").select("product_id").eq("car_model_id", modelId)).data ?? []).map((r: any) => r.product_id) : [],
    enabled: !!modelId,
  });

  const toggle = useMutation({
    mutationFn: async ({ productId, on }: { productId: string; on: boolean }) => {
      if (!modelId) return;
      if (on) {
        const { error } = await supabase.from("product_fitment").insert({ product_id: productId, car_model_id: modelId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_fitment").delete().eq("product_id", productId).eq("car_model_id", modelId);
        if (error) throw error;
      }
      await logActivity("fitment.toggle", "fitment", `${productId}:${modelId}`, { on });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fitment", modelId] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-card border border-line rounded-lg p-3">
        <Label className="text-xs">Car brand</Label>
        <ul className="mt-2 max-h-[460px] overflow-y-auto space-y-1">
          {brands.map((b: any) => (
            <li key={b.id} className={`px-2 py-1.5 rounded text-sm cursor-pointer ${brandId === b.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`} onClick={() => { setBrandId(b.id); setModelId(null); }}>{b.name}</li>
          ))}
        </ul>
      </div>
      <div className="bg-card border border-line rounded-lg p-3">
        <Label className="text-xs">Model</Label>
        <ul className="mt-2 max-h-[460px] overflow-y-auto space-y-1">
          {models.map((m: any) => (
            <li key={m.id} className={`px-2 py-1.5 rounded text-sm cursor-pointer ${modelId === m.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`} onClick={() => setModelId(m.id)}>{m.name} <span className="text-[11px] text-muted-foreground">{m.years ?? ""}</span></li>
          ))}
          {brandId && models.length === 0 && <li className="text-xs text-muted-foreground p-2">No models.</li>}
        </ul>
      </div>
      <div className="bg-card border border-line rounded-lg p-3">
        <Label className="text-xs">Products that fit ({mapped.length})</Label>
        <ul className="mt-2 max-h-[460px] overflow-y-auto space-y-1">
          {modelId && products.map((p: any) => {
            const on = mapped.includes(p.id);
            return (
              <li key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted">
                <Checkbox checked={on} onCheckedChange={(v) => toggle.mutate({ productId: p.id, on: !!v })} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.sku}</div>
                </div>
              </li>
            );
          })}
          {!modelId && <li className="text-xs text-muted-foreground p-2">Select a brand and model first.</li>}
        </ul>
      </div>
    </div>
  );
}

export default Fitment;
