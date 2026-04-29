import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { StatusPicker } from "@/components/admin/StatusPicker";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const STATUSES = ["new", "contacted", "won", "lost"];

const Messages = () => {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r: any) => [r.name, r.email, r.subject, r.message].some((v) => (v ?? "").toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <>
      <AdminPageHeader title="Contact Messages" count={filtered.length} search={search} onSearch={setSearch} />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="Inbox is empty"
        onRowClick={(r) => setActive(r)}
        columns={[
          {
            key: "from",
            header: "From",
            cell: (r: any) => (
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.email}</div>
              </div>
            ),
          },
          { key: "subject", header: "Subject", cell: (r: any) => <span className="text-sm">{r.subject ?? "—"}</span> },
          {
            key: "status",
            header: "Status",
            cell: (r: any) => (
              <div onClick={(e) => e.stopPropagation()}>
                <StatusPicker value={r.status} options={STATUSES} table="contact_messages" id={r.id} invalidate={[["admin-messages"]]} entityType="message" />
              </div>
            ),
          },
          { key: "date", header: "Date", cell: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
        ]}
      />

      {active && (
        <EntityDrawer open onOpenChange={(v) => !v && setActive(null)} title={active.subject ?? "Message"} description={`${active.name} · ${active.email}`} size="lg">
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject ?? "Your message")}`}>
              <Mail className="h-4 w-4 mr-1.5" /> Reply via email
            </a>
          </Button>
          <div className="text-sm whitespace-pre-line border border-line rounded p-3 bg-muted/30">{active.message}</div>
        </EntityDrawer>
      )}
    </>
  );
};

export default Messages;
