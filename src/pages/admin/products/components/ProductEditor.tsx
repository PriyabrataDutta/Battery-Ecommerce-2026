import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/**
 * ProductEditor
 * --------------------------------------------------------------
 * Side-drawer form used to create OR edit a product. Pass `null`
 * to `product` to render in create mode; pass a row to edit it.
 *
 * Validation is intentionally lightweight here — the DB enforces
 * NOT NULL on name/sku/slug/price. To add stricter rules, layer
 * a Zod schema in `../lib/validation.ts` (see Checkout for the
 * pattern) and call it before invoking the mutation.
 */
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

  // Load existing fitment when editing
  const { data: existingFitment } = useQuery({
    queryKey: ["product_fitment", product?.id],
    queryFn: () => getProductFitmentModelIds(product!.id),
    enabled: !!product?.id && open,
  });

  // Load existing gallery images when editing
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
      // Map the row → editable fields. We deliberately drop joined
      // relations (battery_brands, categories) and the row id.
      setForm({
        name: product.name ?? "",
        slug: product.slug ?? "",
        sku: product.sku ?? "",
        brand_id: product.brand_id ?? null,
        category_id: product.category_id ?? null,
        mrp: product.mrp == null ? null : Number(product.mrp),
        price_with_exchange: Number((product as any).price_with_exchange ?? 0),
        price_without_exchange: Number((product as any).price_without_exchange ?? 0),
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
      });
    } else {
      setForm(EMPTY_PRODUCT);
      setFitmentModelIds([]);
      setGalleryImages([]);
    }
  }, [open, product]);

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const remove = useDeleteProduct();
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof ProductEditableFields>(k: K, v: ProductEditableFields[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
    // Save fitment mappings
    await saveProductFitment(productId, fitmentModelIds);
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
      {/* Identity */}
      <Section title="Identity">
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
      </Section>

      {/* Classification */}
      <Section title="Classification">
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
      </Section>

      {/* Pricing & stock */}
      <Section title="Pricing & stock">
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
          <Field label="Selling Price (₹)" hint="Legacy / fallback price">
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
      </Section>

      {/* Media */}
      <Section title="Media">
        <Field label="Primary image URL" hint="Use the storage uploader on the product page for full management.">
          <Input
            value={form.primary_image_url ?? ""}
            onChange={(e) => set("primary_image_url", e.target.value || null)}
            placeholder="https://…"
          />
        </Field>
      </Section>

      {/* Flags */}
      <Section title="Visibility flags">
        <FlagRow
          label="Featured"
          value={form.is_featured}
          onChange={(v) => set("is_featured", v)}
        />
        <FlagRow
          label="Bestseller"
          value={form.is_bestseller}
          onChange={(v) => set("is_bestseller", v)}
        />
        <FlagRow label="New" value={form.is_new} onChange={(v) => set("is_new", v)} />
        <FlagRow label="On sale" value={form.is_on_sale} onChange={(v) => set("is_on_sale", v)} />
      </Section>

      {/* Exchange */}
      <Section title="Battery exchange">
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
      </Section>

      {/* Car Fitment */}
      <Section title="Car Fitment">
        <FitmentEditor
          selectedModelIds={fitmentModelIds}
          onChange={setFitmentModelIds}
        />
      </Section>
    </EntityDrawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
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
