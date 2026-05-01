import { EntityTable } from "@/components/admin/EntityTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REQUEST_STATUSES, type RequestStatus } from "@/api/admin/quotes";
import type { AdminCallbackRequest } from "@/api/admin/messages";
import { useSetCallbackStatus } from "../hooks/useAdminMessages";

export function CallbackRequestsTable({
  rows,
  loading,
}: {
  rows: AdminCallbackRequest[];
  loading: boolean;
}) {
  const setStatus = useSetCallbackStatus();
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      emptyTitle="No callback requests"
      emptyDescription="When customers ask for a callback, they'll appear here."
      columns={[
        {
          key: "who",
          header: "Customer",
          cell: (r) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{r.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{r.phone}</div>
            </div>
          ),
        },
        {
          key: "preferred",
          header: "Preferred time",
          className: "hidden md:table-cell",
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{r.preferred_time ?? "—"}</span>
          ),
        },
        {
          key: "message",
          header: "Message",
          className: "max-w-[360px]",
          cell: (r) => (
            <span className="text-xs text-muted-foreground line-clamp-2">
              {r.message ?? "—"}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} />,
        },
        {
          key: "set-status",
          header: "Change",
          cell: (r) => (
            <Select
              value={r.status}
              onValueChange={(v) =>
                setStatus.mutate({ id: r.id, status: v as RequestStatus, prev: r.status })
              }
              disabled={setStatus.isPending}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        },
        {
          key: "created",
          header: "Asked",
          className: "hidden lg:table-cell",
          cell: (r) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(r.created_at).toLocaleDateString("en-IN")}
            </span>
          ),
        },
      ]}
    />
  );
}
