import { useEffect, useState } from "react";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/adminLog";
import {
  EMPTY_CATEGORY,
  type AdminCategoryRow,
  type CategoryEditableFields,
} from "@/api/admin/categories";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useAdminCategories";

export function CategoryEditor({
  open,
  onOpenChange,
  category,
  allCategories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: AdminCategoryRow | null;
  allCategories: AdminCategoryRow[];
}) {
  const isEdit = !!category;
  const [form, setForm] = useState<CategoryEditableFields>(EMPTY_CATEGORY);

  useEffect(() => {
    if (!open) return;
    if (category) {
      setForm({
        name: category.name ?? "",
        slug: category.slug ?? "",
        description: category.description ?? null,
        icon: category.icon ?? null,
        image_url: category.image_url ?? null,
        parent_id: category.parent_id ?? null,
        sort_order: category.sort_order ?? 0,
        hsn_code: (category as any).hsn_code ?? null,
      });
    } else setForm(EMPTY_CATEGORY);
  }, [open, category]);

  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const saving = create.isPending || update.isPending;

  const set = <K extends keyof CategoryEditableFields>(k: K, v: CategoryEditableFields[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const hsnTrimmed = form.hsn_code?.trim() ?? "";
    if (!hsnTrimmed) {
      toast.error("HSN code is required for every category.");
      return;
    }
    if (!/^\d{4,8}$/.test(hsnTrimmed)) {
      toast.error("HSN code must be 4–8 digits (e.g. 8507 or 85071000).");
      return;
    }
    const slug = form.slug.trim() || slugify(form.name);
    const payload = { ...form, slug };
    if (isEdit && category) await update.mutateAsync({ id: category.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!category) return;
    await remove.mutateAsync(category.id);
    onOpenChange(false);
  };

  // Prevent picking yourself or your descendants as parent (basic guard).
  const parentOptions = allCategories.filter((c) => !category || c.id !== category.id);

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit · ${category?.name}` : "New category"}
      saveLabel={isEdit ? "Save changes" : "Create category"}
      saving={saving}
      onSave={handleSave}
      onDelete={isEdit ? handleDelete : undefined}
      deleteLabel="Delete category"
    >
      <Field label="Name" required>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="HSN Code" required hint="Harmonized System Nomenclature code for this category">
        <Input
          value={form.hsn_code ?? ""}
          onChange={(e) => set("hsn_code", e.target.value || null)}
          placeholder="e.g. 8507"
        />
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
      <Field label="Parent">
        <Select
          value={form.parent_id ?? "__none"}
          onValueChange={(v) => set("parent_id", v === "__none" ? null : v)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No parent (top level)</SelectItem>
            {parentOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Icon" hint="lucide-react icon name (e.g. Battery)">
          <Input
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
          />
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <Field label="Image URL">
        <Input
          value={form.image_url ?? ""}
          onChange={(e) => set("image_url", e.target.value || null)}
          placeholder="https://…"
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
