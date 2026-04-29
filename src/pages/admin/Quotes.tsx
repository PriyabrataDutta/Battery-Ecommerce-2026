import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { StatusPicker } from "@/components/admin/StatusPicker";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, MessageCircle } from "lucide-react";

const REQUEST_STATUSES = ["new", "contacted", "quoted", "won", "lost"];

const Quotes = () => {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r: any) =>
      [r.name, r.company, r.email, r.phone].some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <>
      <AdminPageHeader title="Quote Requests" count={filtered.length} search={search} onSearch={setSearch} />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No quote requests yet"
        onRowClick={(r) => setActive(r)}
        columns={[
          {
            key: "name",
            header: "Customer",
            cell: (r: any) => (
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.company ?? "—"}</div>
              </div>
            ),
          },
          {
            key: "contact",
            header: "Contact",
            cell: (r: any) => (
              <div className="text-xs">
                <div>{r.email}</div>
                <div className="text-muted-foreground">{r.phone}</div>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r: any) => (
              <div onClick={(e) => e.stopPropagation()}>
                <StatusPicker value={r.status} options={REQUEST_STATUSES} table="quote_requests" id={r.id} invalidate={[["admin-quotes"]]} entityType="quote" />
              </div>
            ),
          },
          { key: "date", header: "Date", cell: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
        ]}
      />

      {active && (
        <EntityDrawer open onOpenChange={(v) => !v && setActive(null)} title={active.name} description={active.company ?? undefined} size="lg">
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${active.phone}`}><Phone className="h-4 w-4 mr-1.5" /> Call</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`https://wa.me/${active.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
              </a>
            </Button>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Status</div>
            <StatusPicker value={active.status} options={REQUEST_STATUSES} table="quote_requests" id={active.id} invalidate={[["admin-quotes"]]} entityType="quote" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Requirement</div>
            <div className="text-sm whitespace-pre-line border border-line rounded p-3 bg-muted/30">{active.requirement}</div>
          </div>
          {active.boq_file_url && (
            <Button asChild variant="outline" size="sm">
              <a href={active.boq_file_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View BOQ
              </a>
            </Button>
          )}
        </EntityDrawer>
      )}
    </>
  );
};

export default Quotes;
