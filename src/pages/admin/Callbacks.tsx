import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { StatusPicker } from "@/components/admin/StatusPicker";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";

const STATUSES = ["new", "contacted", "won", "lost"];

const Callbacks = () => {
  const [search, setSearch] = useState("");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-callbacks"],
    queryFn: async () => {
      const { data } = await supabase.from("callback_requests").select("*").order("created_at", { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r: any) => [r.name, r.phone, r.message].some((v) => (v ?? "").toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <>
      <AdminPageHeader title="Callback Requests" count={filtered.length} search={search} onSearch={setSearch} />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No callback requests"
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (r: any) => <div className="font-semibold">{r.name}</div>,
          },
          { key: "phone", header: "Phone", cell: (r: any) => <span className="font-mono text-xs">{r.phone}</span> },
          { key: "preferred", header: "Preferred Time", cell: (r: any) => <span className="text-xs">{r.preferred_time ?? "—"}</span> },
          {
            key: "msg",
            header: "Message",
            cell: (r: any) => <span className="text-xs text-muted-foreground line-clamp-2">{r.message ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            cell: (r: any) => (
              <StatusPicker value={r.status} options={STATUSES} table="callback_requests" id={r.id} invalidate={[["admin-callbacks"]]} entityType="callback" />
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (r: any) => (
              <div className="flex gap-1">
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <a href={`tel:${r.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                  <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="h-3.5 w-3.5" /></a>
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
};

export default Callbacks;
