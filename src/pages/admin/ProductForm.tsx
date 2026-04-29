import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === "new";

  const { data: product } = useQuery({
    queryKey: ["product-edit", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-list"],
    queryFn: async () => (await supabase.from("battery_brands").select("id, name").order("name")).data ?? [],
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  if (!form && (isNew || product)) {
    setForm(product ?? {
      name: "", sku: "", slug: "", price: 0, mrp: null, stock: 0,
      brand_id: null, category_id: null, warranty_months: null, capacity_ah: null,
      short_description: "", description: "", primary_image_url: null,
      has_exchange: true, exchange_rebate: 0, status: "active",
      is_featured: false, is_bestseller: false, is_new: false, is_on_sale: false,
      specs: {}, badges: [],
    });
    return null;
  }
  if (!form) return <div>Loading…</div>;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };
      delete payload.battery_brands;
      delete payload.categories;
      if (isNew) {
        delete payload.id;
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); navigate("/admin/products"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/products")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="bg-white border border-line p-6 grid md:grid-cols-2 gap-5">
        <Field label="Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="SKU"><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="Slug"><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white"><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Battery Brand">
          <Select value={form.brand_id ?? ""} onValueChange={(v) => set("brand_id", v || null)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className="bg-white">{brands.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Category">
          <Select value={form.category_id ?? ""} onValueChange={(v) => set("category_id", v || null)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className="bg-white">{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Price (₹)"><Input type="number" value={form.price ?? 0} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></Field>
        <Field label="MRP (₹)"><Input type="number" value={form.mrp ?? ""} onChange={(e) => set("mrp", e.target.value ? parseFloat(e.target.value) : null)} /></Field>
        <Field label="Stock"><Input type="number" value={form.stock ?? 0} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} /></Field>
        <Field label="Warranty (months)"><Input type="number" value={form.warranty_months ?? ""} onChange={(e) => set("warranty_months", e.target.value ? parseInt(e.target.value) : null)} /></Field>
        <Field label="Capacity (Ah)"><Input type="number" value={form.capacity_ah ?? ""} onChange={(e) => set("capacity_ah", e.target.value ? parseInt(e.target.value) : null)} /></Field>
        <Field label="Exchange Rebate (₹)"><Input type="number" value={form.exchange_rebate ?? 0} onChange={(e) => set("exchange_rebate", parseFloat(e.target.value) || 0)} /></Field>
        <div className="md:col-span-2"><Field label="Short Description"><Input value={form.short_description ?? ""} onChange={(e) => set("short_description", e.target.value)} /></Field></div>
        <div className="md:col-span-2"><Field label="Full Description"><Textarea rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field></div>
        <div className="md:col-span-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Primary Image</Label>
          <ImageUpload bucket="product-images" value={form.primary_image_url} onChange={(url) => set("primary_image_url", url)} />
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-line">
          <Toggle label="Featured" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
          <Toggle label="Bestseller" checked={form.is_bestseller} onChange={(v) => set("is_bestseller", v)} />
          <Toggle label="New" checked={form.is_new} onChange={(v) => set("is_new", v)} />
          <Toggle label="On Sale" checked={form.is_on_sale} onChange={(v) => set("is_on_sale", v)} />
          <Toggle label="Has Exchange" checked={form.has_exchange} onChange={(v) => set("has_exchange", v)} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="h-4 w-4 mr-2" /> Save</Button>
        {!isNew && (
          <Button variant="outline" onClick={() => { if (confirm("Delete this product?")) del.mutate(); }}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} /> {label}
    </label>
  );
}

export default ProductForm;
