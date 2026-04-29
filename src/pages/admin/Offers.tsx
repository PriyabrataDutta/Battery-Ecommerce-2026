import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logActivity } from "@/lib/adminLog";

type Offer = {
  id?: string;
  title: string;
  code: string;
  description: string | null;
  type: "percent" | "flat";
  value: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  min_order_total: number;
};

const empty: Offer = { title: "", code: "", description: null, type: "percent", value: 10, starts_at: null, ends_at: null, is_active: true, min_order_total: 0 };

const Offers = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Offer | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => (await supabase.from("offers").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? rows.filter((r: any) => [r.title, r.code].some((v) => (v ?? "").toLowerCase().includes(q))) : rows;
  }, [rows, search]);

  const save = useMutation({
    mutationFn: async (o: Offer) => {
      const payload: any = {
        title: o.title,
        code: o.code.toUpperCase(),
        description: o.description,
        type: o.type,
        value: Number(o.value),
        starts_at: o.starts_at,
        ends_at: o.ends_at,
        is_active: o.is_active,
        min_order_total: Number(o.min_order_total) || 0,
      };
      if (o.id) {
        const { error } = await supabase.from("offers").update(payload).eq("id", o.id);
        if (error) throw error;
        await logActivity("offer.update", "offer", o.id, payload);
      } else {
        const { data, error } = await supabase.from("offers").insert(payload).select().single();
        if (error) throw error;
        await logActivity("offer.create", "offer", data.id, payload);
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-offers"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
      await logActivity("offer.delete", "offer", id);
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-offers"] }); setDraft(null); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader title="Offers & Coupons" count={filtered.length} search={search} onSearch={setSearch} onCreate={() => setDraft({ ...empty })} createLabel="New Offer" />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No offers yet"
        emptyAction={{ label: "Create first offer", onClick: () => setDraft({ ...empty }) }}
        onRowClick={(r: any) => setDraft({ ...r })}
        columns={[
          { key: "title", header: "Title", cell: (r: any) => (
            <div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{r.code}</div>
            </div>
          )},
          { key: "value", header: "Discount", cell: (r: any) => <span className="font-semibold">{r.type === "percent" ? `${r.value}%` : `₹${r.value}`}</span> },
          { key: "valid", header: "Valid", cell: (r: any) => (
            <span className="text-xs text-muted-foreground">
              {r.starts_at ? new Date(r.starts_at).toLocaleDateString() : "—"} → {r.ends_at ? new Date(r.ends_at).toLocaleDateString() : "∞"}
            </span>
          )},
          { key: "active", header: "Active", cell: (r: any) => (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {r.is_active ? "ACTIVE" : "OFF"}
            </span>
          )},
        ]}
      />

      {draft && (
        <EntityDrawer open onOpenChange={(v) => !v && setDraft(null)} title={draft.id ? "Edit Offer" : "New Offer"} onSave={() => save.mutate(draft)} saving={save.isPending} onDelete={draft.id ? () => del.mutate(draft.id!) : undefined}>
          <Field label="Title"><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
          <Field label="Coupon code"><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className="font-mono uppercase" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Type">
              <Select value={draft.type} onValueChange={(v: any) => setDraft({ ...draft, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="flat">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Value"><Input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Min order total (₹)"><Input type="number" value={draft.min_order_total} onChange={(e) => setDraft({ ...draft, min_order_total: Number(e.target.value) })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Starts"><Input type="datetime-local" value={draft.starts_at?.slice(0, 16) ?? ""} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
            <Field label="Ends"><Input type="datetime-local" value={draft.ends_at?.slice(0, 16) ?? ""} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
          <div className="flex items-center gap-2">
            <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            <Label className="text-sm">Active</Label>
          </div>
        </EntityDrawer>
      )}
    </>
  );
};

const Field = ({ label, children }: any) => (<div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>);

export default Offers;
