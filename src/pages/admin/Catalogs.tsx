import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/adminLog";
import { formatBytes } from "@/lib/adminLog";

type CatalogFile = {
  id?: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string;
  size_bytes: number | null;
};

const empty: CatalogFile = { title: "", description: null, category: null, file_url: "", size_bytes: null };

const Catalogs = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<CatalogFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-catalogs"],
    queryFn: async () => (await supabase.from("catalog_files").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? rows.filter((r: any) => [r.title, r.category].some((v) => (v ?? "").toLowerCase().includes(q))) : rows;
  }, [rows, search]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from("catalogs").upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from("catalogs").getPublicUrl(path);
      setDraft({ ...(draft ?? empty), file_url: pub.publicUrl, size_bytes: file.size, title: draft?.title || file.name.replace(/\.[^.]+$/, "") });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async (c: CatalogFile) => {
      if (!c.file_url) throw new Error("Upload a PDF first.");
      const payload = { title: c.title, description: c.description, category: c.category, file_url: c.file_url, size_bytes: c.size_bytes };
      if (c.id) {
        const { error } = await supabase.from("catalog_files").update(payload).eq("id", c.id);
        if (error) throw error;
        await logActivity("catalog.update", "catalog", c.id, payload);
      } else {
        const { data, error } = await supabase.from("catalog_files").insert(payload).select().single();
        if (error) throw error;
        await logActivity("catalog.create", "catalog", data.id, payload);
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-catalogs"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_files").delete().eq("id", id);
      if (error) throw error;
      await logActivity("catalog.delete", "catalog", id);
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-catalogs"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader title="PDF Catalogs" count={filtered.length} search={search} onSearch={setSearch} onCreate={() => setDraft({ ...empty })} createLabel="Upload Catalog" />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No catalogs uploaded"
        emptyAction={{ label: "Upload first catalog", onClick: () => setDraft({ ...empty }) }}
        onRowClick={(r: any) => setDraft({ ...r })}
        columns={[
          { key: "title", header: "Title", cell: (r: any) => <div className="font-semibold">{r.title}</div> },
          { key: "category", header: "Category", cell: (r: any) => <span className="text-sm">{r.category ?? "—"}</span> },
          { key: "size", header: "Size", cell: (r: any) => <span className="text-xs">{formatBytes(r.size_bytes ?? 0)}</span> },
          { key: "open", header: "", cell: (r: any) => (
            <Button asChild variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
              <a href={r.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          )},
        ]}
      />

      {draft && (
        <EntityDrawer open onOpenChange={(v) => !v && setDraft(null)} title={draft.id ? "Edit Catalog" : "New Catalog"} onSave={() => save.mutate(draft)} saving={save.isPending} onDelete={draft.id ? () => del.mutate(draft.id!) : undefined}>
          <Field label="Title"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Category"><Input placeholder="e.g. Cars, Inverters" value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
          <Field label="Description"><Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <Field label="PDF file">
            {draft.file_url ? (
              <div className="flex items-center justify-between border border-line rounded p-2 text-sm">
                <a href={draft.file_url} target="_blank" rel="noreferrer" className="text-primary truncate flex-1">View uploaded PDF ({formatBytes(draft.size_bytes ?? 0)})</a>
                <Button variant="ghost" size="sm" onClick={() => setDraft({ ...draft, file_url: "", size_bytes: null })}>Replace</Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-line rounded p-6 cursor-pointer hover:bg-muted/50">
                <Upload className="h-5 w-5" />
                <span className="text-sm">{uploading ? "Uploading..." : "Click to upload PDF"}</span>
                <input type="file" accept="application/pdf" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            )}
          </Field>
        </EntityDrawer>
      )}
    </>
  );
};

const Field = ({ label, children }: any) => (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);

export default Catalogs;
