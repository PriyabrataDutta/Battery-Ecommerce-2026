import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logActivity, slugify } from "@/lib/adminLog";

type Category = {
  id?: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

const empty: Category = {
  name: "",
  slug: "",
  parent_id: null,
  description: null,
  image_url: null,
  sort_order: 0,
};

const Categories = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Category | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");
      return data ?? [];
    },
  });

  const { data: productCounts = {} } = useQuery({
    queryKey: ["admin-category-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("category_id");
      const m: Record<string, number> = {};
      (data ?? []).forEach((p: any) => p.category_id && (m[p.category_id] = (m[p.category_id] ?? 0) + 1));
      return m;
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? rows.filter((r: any) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const save = useMutation({
    mutationFn: async (c: Category) => {
      const payload = {
        name: c.name,
        slug: c.slug || slugify(c.name),
        parent_id: c.parent_id || null,
        description: c.description,
        image_url: c.image_url,
        sort_order: Number(c.sort_order) || 0,
      };
      if (c.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", c.id);
        if (error) throw error;
        await logActivity("category.update", "category", c.id, payload);
      } else {
        const { data, error } = await supabase.from("categories").insert(payload).select().single();
        if (error) throw error;
        await logActivity("category.create", "category", data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setDraft(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const count = productCounts[id] ?? 0;
      if (count > 0) throw new Error(`Cannot delete: ${count} products use this category.`);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      await logActivity("category.delete", "category", id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setDraft(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader
        title="Categories"
        count={filtered.length}
        search={search}
        onSearch={setSearch}
        onCreate={() => setDraft({ ...empty })}
        createLabel="New Category"
      />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No categories yet"
        emptyAction={{ label: "Create first category", onClick: () => setDraft({ ...empty }) }}
        onRowClick={(r: any) => setDraft({ ...r })}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r: any) => (
              <div className="flex items-center gap-2">
                {r.image_url && <img src={r.image_url} alt="" className="h-8 w-8 object-cover rounded" />}
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">/{r.slug}</div>
                </div>
              </div>
            ),
          },
          {
            key: "parent",
            header: "Parent",
            cell: (r: any) => <span className="text-sm">{rows.find((p: any) => p.id === r.parent_id)?.name ?? "—"}</span>,
          },
          {
            key: "products",
            header: "Products",
            cell: (r: any) => <span className="text-sm font-semibold">{productCounts[r.id] ?? 0}</span>,
          },
          { key: "sort", header: "Sort", cell: (r: any) => <span className="text-xs">{r.sort_order}</span> },
        ]}
      />

      {draft && (
        <EntityDrawer
          open
          onOpenChange={(v) => !v && setDraft(null)}
          title={draft.id ? "Edit Category" : "New Category"}
          onSave={() => save.mutate(draft)}
          saving={save.isPending}
          onDelete={draft.id ? () => del.mutate(draft.id!) : undefined}
        >
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })} />
          </Field>
          <Field label="Slug">
            <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          </Field>
          <Field label="Parent category">
            <Select value={draft.parent_id ?? "none"} onValueChange={(v) => setDraft({ ...draft, parent_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top-level)</SelectItem>
                {rows.filter((r: any) => r.id !== draft.id).map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Sort order">
            <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <Field label="Image">
            <ImageUpload bucket="product-images" value={draft.image_url ?? ""} onChange={(url) => setDraft({ ...draft, image_url: url })} />
          </Field>
        </EntityDrawer>
      )}
    </>
  );
};

const Field = ({ label, children }: any) => (
  <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
);

export default Categories;
