import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const ActivityLog = () => {
  const [search, setSearch] = useState("");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => (await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? rows.filter((r: any) =>
          [r.actor_email, r.action, r.entity_type, r.entity_id].some((v) => (v ?? "").toLowerCase().includes(q))
        )
      : rows;
  }, [rows, search]);

  return (
    <>
      <AdminPageHeader title="Activity Log" count={filtered.length} search={search} onSearch={setSearch} />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No activity recorded yet"
        columns={[
          { key: "when", header: "When", cell: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
          { key: "actor", header: "Actor", cell: (r: any) => <span className="text-sm">{r.actor_email ?? "—"}</span> },
          { key: "action", header: "Action", cell: (r: any) => <span className="font-mono text-xs">{r.action}</span> },
          { key: "target", header: "Target", cell: (r: any) => <span className="text-xs"><span className="text-muted-foreground">{r.entity_type}</span> · {r.entity_id ?? "—"}</span> },
          { key: "diff", header: "", cell: (r: any) => (
            <Popover>
              <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></PopoverTrigger>
              <PopoverContent className="w-96"><pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(r.diff, null, 2)}</pre></PopoverContent>
            </Popover>
          )},
        ]}
      />
    </>
  );
};

export default ActivityLog;
