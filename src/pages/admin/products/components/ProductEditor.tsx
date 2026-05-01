import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, X } from "lucide-react";
import { slugify } from "@/lib/adminLog";
import { EMPTY_PRODUCT, PRODUCT_STATUSES } from "../lib/constants";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "../hooks/useAdminProducts";
import { FitmentEditor } from "./FitmentEditor";
import { ProductMediaSection } from "./ProductMediaSection";
import { getProductFitmentModelIds, saveProductFitment } from "@/api/admin/productFitment";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProductRow } from "@/api/admin/products";
import type { BatteryBrand, Category } from "@/types/catalog";
import type { ProductEditableFields } from "@/api/admin/products";

export function ProductEditor({
  open,
  onOpenChange,
  product,
  brands,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: AdminProductRow | null;
  brands: BatteryBrand[];
  categories: Category[];
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<ProductEditableFields>(EMPTY_PRODUCT);
  const [fitmentModelIds, setFitmentModelIds] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: existingFitment } = useQuery({
    queryKey: ["product_fitment", product?.id],
    queryFn: () => getProductFitmentModelIds(product!.id),
    enabled: !!product?.id && open,
  });

  const { data: existingGallery } = useQuery({
    queryKey: ["product_images", product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("url")
        .eq("product_id", product!.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => r.url);
    },
    enabled: !!product?.id && open,
  });

  useEffect(() => {
    if (existingFitment) setFitmentModelIds(existingFitment);
  }, [existingFitment]);

  useEffect(() => {
    if (existingGallery) setGalleryImages(existingGallery);
  }, [existingGallery]);

  useEffect(() => {
    if (!open) return;
    if (product) {
      const p = product as any;
      setForm({
        name: product.name ?? "",
        slug: product.slug ?? "",
        sku: product.sku ?? "",
        brand_id: product.brand_id ?? null,
        category_id: product.category_id ?? null,
        mrp: product.mrp == null ? null : Number(product.mrp),
        price_with_exchange: Number(p.price_with_exchange ?? 0),
        price_without_exchange: Number(p.price_without_exchange ?? 0),
        price: Number(product.price ?? 0),
        stock: Number(product.stock ?? 0),
        capacity_ah: product.capacity_ah ?? null,
        warranty_months: product.warranty_months ?? null,
        short_description: product.short_description ?? null,
        description: product.description ?? null,
        primary_image_url: product.primary_image_url ?? null,
        status: product.status ?? "draft",
        is_featured: !!product.is_featured,
        is_bestseller: !!product.is_bestseller,
        is_new: !!product.is_new,
        is_on_sale: !!product.is_on_sale,
        has_exchange: !!product.has_exchange,
        exchange_rebate: Number(product.exchange_rebate ?? 0),
        meta_title: p.meta_title ?? null,
        meta_description: p.meta_description ?? null,
        meta_keywords: p.meta_keywords ?? null,
        tags: Array.isArray(p.tags) ? p.tags : [],
      });
      setTagInput("");
    } else {
      setForm(EMPTY_PRODUCT);
      setFitmentModelIds([]);
      setGalleryImages([]);
      setTagInput("");
    }
  }, [open, product]);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof ProductEditableFields>(k: K, v: ProductEditableFields[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    set("tags", form.tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || form.price < 0) return;
    const slug = form.slug.trim() || slugify(form.name);
    const payload = { ...form, slug };
    let productId: string;
    if (isEdit && product) {
      await update.mutateAsync({ id: product.id, patch: payload });
      productId = product.id;
    } else {
      const created = await create.mutateAsync(payload);
      productId = created.id;
    }
    await saveProductFitment(productId, fitmentModelIds);
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (galleryImages.length > 0) {
      const rows = galleryImages.map((url, i) => ({
        product_id: productId,
        url,
        sort_order: i,
      }));
      await supabase.from("product_images").insert(rows);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!product) return;
    await remove.mutateAsync(product.id);
    onOpenChange(false);
  };

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit · ${product?.name}` : "New product"}
      description={isEdit ? "Update the product details and save." : "Create a new product."}
      size="lg"
      saveLabel={isEdit ? "Save changes" : "Create product"}
      saving={saving}
      onSave={handleSave}
      onDelete={isEdit ? handleDelete : undefined}
      deleteLabel="Delete product"
    >
      {/* ── General ── */}
      <CollapsibleSection title="General" defaultOpen>
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU" required>
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </Field>
          <Field label="Slug" hint="Auto-generated from name if blank">
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </Field>
        </div>
        <Field label="Short description">
          <Textarea
            rows={2}
            value={form.short_description ?? ""}
            onChange={(e) => set("short_description", e.target.value || null)}
          />
        </Field>
        <Field label="Long description">
          <Textarea
            rows={4}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
          />
        </Field>
      </CollapsibleSection>

      {/* ── Classification ── */}
      <CollapsibleSection title="Classification" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <SelectField
              value={form.brand_id}
              onChange={(v) => set("brand_id", v)}
              placeholder="No brand"
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
            />
          </Field>
          <Field label="Category">
            <SelectField
              value={form.category_id}
              onChange={(v) => set("category_id", v)}
              placeholder="No category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
        </div>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </CollapsibleSection>

      {/* ── Pricing & Stock ── */}
      <CollapsibleSection title="Pricing & Stock" defaultOpen>
        <div className="grid grid-cols-3 gap-3">
          <Field label="MRP (₹)" required>
            <Input
              type="number"
              min={0}
              value={form.mrp ?? ""}
              onChange={(e) => set("mrp", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="With Exchange (₹)" required>
            <Input
              type="number"
              min={0}
              value={form.price_with_exchange}
              onChange={(e) => set("price_with_exchange", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Without Exchange (₹)" required>
            <Input
              type="number"
              min={0}
              value={form.price_without_exchange}
              onChange={(e) => set("price_without_exchange", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Selling Price (₹)" hint="Legacy / fallback">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Stock">
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── Specifications ── */}
      <CollapsibleSection title="Specifications">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity (Ah)">
            <Input
              type="number"
              value={form.capacity_ah ?? ""}
              onChange={(e) =>
                set("capacity_ah", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Warranty (months)">
            <Input
              type="number"
              value={form.warranty_months ?? ""}
              onChange={(e) =>
                set("warranty_months", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── Media ── */}
      <CollapsibleSection title="Media" defaultOpen>
        <ProductMediaSection
          featuredImage={form.primary_image_url}
          onFeaturedChange={(url) => set("primary_image_url", url)}
          galleryImages={galleryImages}
          onGalleryChange={setGalleryImages}
        />
      </CollapsibleSection>

      {/* ── Visibility Flags ── */}
      <CollapsibleSection title="Visibility Flags">
        <FlagRow label="Featured" value={form.is_featured} onChange={(v) => set("is_featured", v)} />
        <FlagRow label="Bestseller" value={form.is_bestseller} onChange={(v) => set("is_bestseller", v)} />
        <FlagRow label="New" value={form.is_new} onChange={(v) => set("is_new", v)} />
        <FlagRow label="On sale" value={form.is_on_sale} onChange={(v) => set("is_on_sale", v)} />
      </CollapsibleSection>

      {/* ── Battery Exchange ── */}
      <CollapsibleSection title="Battery Exchange">
        <FlagRow
          label="Exchange available"
          value={form.has_exchange}
          onChange={(v) => set("has_exchange", v)}
        />
        <Field label="Exchange rebate (₹)">
          <Input
            type="number"
            min={0}
            value={form.exchange_rebate}
            onChange={(e) => set("exchange_rebate", Number(e.target.value) || 0)}
          />
        </Field>
      </CollapsibleSection>

      {/* ── Tags ── */}
      <CollapsibleSection title="Tags">
        <Field label="Product tags" hint="Press Enter or comma to add a tag">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Type and press Enter…"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />
        </Field>
      </CollapsibleSection>

      {/* ── SEO ── */}
      <CollapsibleSection title="SEO">
        <Field label="Meta title" hint="Max 60 characters recommended">
          <Input
            value={form.meta_title ?? ""}
            maxLength={70}
            onChange={(e) => set("meta_title", e.target.value || null)}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {(form.meta_title ?? "").length}/60
          </p>
        </Field>
        <Field label="Meta description" hint="Max 160 characters recommended">
          <Textarea
            rows={2}
            value={form.meta_description ?? ""}
            maxLength={170}
            onChange={(e) => set("meta_description", e.target.value || null)}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {(form.meta_description ?? "").length}/160
          </p>
        </Field>
        <Field label="Meta keywords" hint="Comma-separated keywords">
          <Input
            value={form.meta_keywords ?? ""}
            onChange={(e) => set("meta_keywords", e.target.value || null)}
            placeholder="battery, car battery, amaron…"
          />
        </Field>
      </CollapsibleSection>

      {/* ── Car Fitment ── */}
      <CollapsibleSection title="Car Fitment">
        <FitmentEditor
          selectedModelIds={fitmentModelIds}
          onChange={setFitmentModelIds}
        />
      </CollapsibleSection>
    </EntityDrawer>
  );
}

/* ── Helper components ── */

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FlagRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(v) => onChange(v === "__none" ? null : v)}
    >
      <SelectTrigger className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
