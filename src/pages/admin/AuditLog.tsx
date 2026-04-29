import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type ActionFilter = "all" | "admin.session_expired" | "admin.access_revoked" | "admin.global_signout";

interface LogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: Record<string, unknown>;
}

const PAGE_SIZE = 50;

const AdminAuditLog = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("activity_log")
      .select("id, created_at, actor_id, actor_email, action, entity_type, entity_id, diff")
      .in("action", [
        "admin.session_expired",
        "admin.access_revoked",
        "admin.global_signout",
      ])
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (actionFilter !== "all") q = q.eq("action", actionFilter);
    if (userId.trim()) {
      // entity_id is the user id for these events; also match actor_id
      const u = userId.trim();
      q = q.or(`entity_id.eq.${u},actor_id.eq.${u}`);
    }
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(to + "T23:59:59").toISOString());

    const { data, error } = await q;
    setLoading(false);
    if (error) {
      toast.error("Failed to load audit log", { description: error.message });
      return;
    }
    setRows((data ?? []) as LogRow[]);
  };

  useEffect(() => {
    document.title = "Admin Audit Log";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setUserId("");
    setActionFilter("all");
    setFrom("");
    setTo("");
    setTimeout(load, 0);
  };

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.action] = (counts[r.action] ?? 0) + 1;
    return counts;
  }, [rows]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              placeholder="UUID (actor or affected user)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Event</Label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admin events</SelectItem>
                <SelectItem value="admin.session_expired">Session expired</SelectItem>
                <SelectItem value="admin.access_revoked">Access revoked</SelectItem>
                <SelectItem value="admin.global_signout">Global sign-out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
          <Button variant="outline" onClick={reset} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
          <div className="ml-auto text-xs text-muted-foreground">
            {rows.length} result{rows.length === 1 ? "" : "s"}
            {Object.entries(summary).length > 0 && (
              <span className="ml-2">
                ({Object.entries(summary)
                  .map(([k, v]) => `${k.replace("admin.", "")}: ${v}`)
                  .join(", ")})
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">When</TableHead>
              <TableHead className="w-[170px]">Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead className="w-[130px]">IP</TableHead>
              <TableHead>Reason / details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No matching events.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((r) => {
                const d = (r.diff ?? {}) as Record<string, unknown>;
                const ip = (d.ip as string) ?? "—";
                const reason = (d.reason as string) ?? "";
                const ua = (d.user_agent as string) ?? "";
                const uid = r.entity_id ?? (d.user_id as string | undefined) ?? "—";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.action === "admin.access_revoked"
                            ? "destructive"
                            : r.action === "admin.global_signout"
                              ? "default"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {r.action.replace("admin.", "")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.actor_email ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] truncate max-w-[200px]">
                      {uid}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ip}</TableCell>
                    <TableCell className="text-xs">
                      {reason && <div className="font-medium">{reason}</div>}
                      {ua && (
                        <div
                          className="text-muted-foreground truncate max-w-[400px]"
                          title={ua}
                        >
                          {ua}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
