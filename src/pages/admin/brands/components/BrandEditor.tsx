import { useEffect, useState } from "react";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/adminLog";
import {
  EMPTY_BRAND,
  type AdminBrandRow,
  type BrandEditableFields,
} from "@/api/admin/brands";
import { useCreateBrand, useUpdateBrand, useDeleteBrand } from "../hooks/useAdminBrands";

/**
 * BrandEditor — create / edit drawer for `battery_brands`.
 */
export function BrandEditor({
  open,
  onOpenChange,
  brand,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brand: AdminBrandRow | null;
}) {
  const isEdit = !!brand;
  const [form, setForm] = useState<BrandEditableFields>(EMPTY_BRAND);

  useEffect(() => {
    if (!open) return;
    if (brand) {
      setForm({
        name: brand.name ?? "",
        slug: brand.slug ?? "",
        description: brand.description ?? null,
        logo_url: brand.logo_url ?? null,
        sort_order: brand.sort_order ?? 0,
      });
    } else {
      setForm(EMPTY_BRAND);
    }
  }, [open, brand]);

  const create = useCreateBrand();
  const update = useUpdateBrand();
  const remove = useDeleteBrand();
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof BrandEditableFields>(k: K, v: BrandEditableFields[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const slug = form.slug.trim() || slugify(form.name);
    const payload = { ...form, slug };
    if (isEdit && brand) await update.mutateAsync({ id: brand.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!brand) return;
    await remove.mutateAsync(brand.id);
    onOpenChange(false);
  };

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit · ${brand?.name}` : "New brand"}
      description={isEdit ? "Update the brand and save." : "Create a new battery brand."}
      saveLabel={isEdit ? "Save changes" : "Create brand"}
      saving={saving}
      onSave={handleSave}
      onDelete={isEdit ? handleDelete : undefined}
      deleteLabel="Delete brand"
    >
      <Field label="Name" required>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Slug" hint="Auto-generated from name if blank">
        <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea
          rows={3}
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
        />
      </Field>
      <Field label="Logo URL" hint="Upload via Storage > brand-logos and paste the public URL.">
        <Input
          value={form.logo_url ?? ""}
          onChange={(e) => set("logo_url", e.target.value || null)}
          placeholder="https://…"
        />
      </Field>
      <Field label="Sort order" hint="Lower numbers appear first.">
        <Input
          type="number"
          value={form.sort_order}
          onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
        />
      </Field>
    </EntityDrawer>
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
