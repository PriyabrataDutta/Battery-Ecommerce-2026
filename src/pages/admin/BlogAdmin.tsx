import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { logActivity, slugify } from "@/lib/adminLog";

type Post = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
};

const empty: Post = { title: "", slug: "", excerpt: null, body: "", cover_url: null, is_published: false, published_at: null };

const BlogAdmin = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [draft, setDraft] = useState<Post | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => (await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows
      .filter((r: any) => filter === "all" ? true : filter === "published" ? r.is_published : !r.is_published)
      .filter((r: any) => !q || r.title.toLowerCase().includes(q));
  }, [rows, search, filter]);

  const save = useMutation({
    mutationFn: async (p: Post) => {
      const payload: any = {
        title: p.title,
        slug: p.slug || slugify(p.title),
        excerpt: p.excerpt,
        body: p.body,
        cover_url: p.cover_url,
        is_published: p.is_published,
        published_at: p.is_published ? (p.published_at ?? new Date().toISOString()) : null,
      };
      if (p.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", p.id);
        if (error) throw error;
        await logActivity("blog.update", "blog_post", p.id, { title: p.title, is_published: p.is_published });
      } else {
        const { data, error } = await supabase.from("blog_posts").insert(payload).select().single();
        if (error) throw error;
        await logActivity("blog.create", "blog_post", data.id, { title: p.title });
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
      await logActivity("blog.delete", "blog_post", id);
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader
        title="Blog Posts"
        count={filtered.length}
        search={search}
        onSearch={setSearch}
        onCreate={() => setDraft({ ...empty })}
        createLabel="New Post"
        actions={
          <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No posts yet"
        emptyAction={{ label: "Write first post", onClick: () => setDraft({ ...empty }) }}
        onRowClick={(r: any) => setDraft({ ...r })}
        columns={[
          {
            key: "title",
            header: "Title",
            cell: (r: any) => (
              <div className="flex items-center gap-2">
                {r.cover_url && <img src={r.cover_url} alt="" className="h-10 w-16 object-cover rounded" />}
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground">/{r.slug}</div>
                </div>
              </div>
            ),
          },
          { key: "status", header: "Status", cell: (r: any) => (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_published ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {r.is_published ? "PUBLISHED" : "DRAFT"}
            </span>
          )},
          { key: "date", header: "Date", cell: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
        ]}
      />

      {draft && (
        <EntityDrawer open onOpenChange={(v) => !v && setDraft(null)} title={draft.id ? "Edit Post" : "New Post"} onSave={() => save.mutate(draft)} saving={save.isPending} onDelete={draft.id ? () => del.mutate(draft.id!) : undefined} size="xl">
          <Field label="Title"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.slug || slugify(e.target.value) })} /></Field>
          <Field label="Slug"><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></Field>
          <Field label="Excerpt"><Textarea rows={2} value={draft.excerpt ?? ""} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></Field>
          <Field label="Cover image">
            <ImageUpload bucket="blog" value={draft.cover_url ?? ""} onChange={(url) => setDraft({ ...draft, cover_url: url })} />
          </Field>
          <Field label="Body (Markdown)">
            <MarkdownEditor value={draft.body ?? ""} onChange={(v) => setDraft({ ...draft, body: v })} />
          </Field>
          <div className="flex items-center gap-2">
            <Switch checked={draft.is_published} onCheckedChange={(v) => setDraft({ ...draft, is_published: v })} />
            <Label className="text-sm">Published</Label>
          </div>
        </EntityDrawer>
      )}
    </>
  );
};

const Field = ({ label, children }: any) => (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);

export default BlogAdmin;
