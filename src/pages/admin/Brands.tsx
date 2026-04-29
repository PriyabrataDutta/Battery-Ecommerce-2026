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
import { toast } from "sonner";
import { logActivity, slugify } from "@/lib/adminLog";

type Brand = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
};

const empty: Brand = { name: "", slug: "", description: null, logo_url: null, sort_order: 0 };

const Brands = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Brand | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data } = await supabase.from("battery_brands").select("*").order("sort_order").order("name");
      return data ?? [];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["admin-brand-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("brand_id");
      const m: Record<string, number> = {};
      (data ?? []).forEach((p: any) => p.brand_id && (m[p.brand_id] = (m[p.brand_id] ?? 0) + 1));
      return m;
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? rows.filter((r: any) => r.name.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const save = useMutation({
    mutationFn: async (b: Brand) => {
      const payload = {
        name: b.name,
        slug: b.slug || slugify(b.name),
        description: b.description,
        logo_url: b.logo_url,
        sort_order: Number(b.sort_order) || 0,
      };
      if (b.id) {
        const { error } = await supabase.from("battery_brands").update(payload).eq("id", b.id);
        if (error) throw error;
        await logActivity("brand.update", "brand", b.id, payload);
      } else {
        const { data, error } = await supabase.from("battery_brands").insert(payload).select().single();
        if (error) throw error;
        await logActivity("brand.create", "brand", data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      setDraft(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const c = counts[id] ?? 0;
      if (c > 0) throw new Error(`Cannot delete: ${c} products use this brand.`);
      const { error } = await supabase.from("battery_brands").delete().eq("id", id);
      if (error) throw error;
      await logActivity("brand.delete", "brand", id);
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      setDraft(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader
        title="Battery Brands"
        count={filtered.length}
        search={search}
        onSearch={setSearch}
        onCreate={() => setDraft({ ...empty })}
        createLabel="New Brand"
      />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No brands yet"
        emptyAction={{ label: "Create first brand", onClick: () => setDraft({ ...empty }) }}
        onRowClick={(r: any) => setDraft({ ...r })}
        columns={[
          {
            key: "logo",
            header: "Brand",
            cell: (r: any) => (
              <div className="flex items-center gap-2">
                {r.logo_url ? (
                  <img src={r.logo_url} alt="" className="h-8 w-12 object-contain bg-white border border-line rounded p-0.5" />
                ) : (
                  <div className="h-8 w-12 grid place-items-center bg-muted text-[10px] font-bold rounded">{r.name.slice(0, 3).toUpperCase()}</div>
                )}
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">/{r.slug}</div>
                </div>
              </div>
            ),
          },
          { key: "products", header: "Products", cell: (r: any) => <span className="font-semibold">{counts[r.id] ?? 0}</span> },
          { key: "sort", header: "Sort", cell: (r: any) => <span className="text-xs">{r.sort_order}</span> },
        ]}
      />

      {draft && (
        <EntityDrawer
          open
          onOpenChange={(v) => !v && setDraft(null)}
          title={draft.id ? "Edit Brand" : "New Brand"}
          onSave={() => save.mutate(draft)}
          saving={save.isPending}
          onDelete={draft.id ? () => del.mutate(draft.id!) : undefined}
        >
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })} />
          </Field>
          <Field label="Slug"><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
          <Field label="Sort order"><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></Field>
          <Field label="Description"><Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <Field label="Logo">
            <ImageUpload bucket="brand-logos" value={draft.logo_url ?? ""} onChange={(url) => setDraft({ ...draft, logo_url: url })} />
          </Field>
        </EntityDrawer>
      )}
    </>
  );
};

const Field = ({ label, children }: any) => (
  <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>
);

export default Brands;
