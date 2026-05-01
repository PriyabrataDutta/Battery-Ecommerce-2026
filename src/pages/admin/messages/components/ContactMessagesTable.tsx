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
import type { AdminContactMessage } from "@/api/admin/messages";
import { useSetContactStatus } from "../hooks/useAdminMessages";

export function ContactMessagesTable({
  rows,
  loading,
}: {
  rows: AdminContactMessage[];
  loading: boolean;
}) {
  const setStatus = useSetContactStatus();
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      emptyTitle="No contact messages"
      emptyDescription="When customers submit the contact form, they'll appear here."
      columns={[
        {
          key: "from",
          header: "From",
          cell: (m) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{m.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ""}
              </div>
            </div>
          ),
        },
        {
          key: "subject",
          header: "Subject",
          className: "hidden md:table-cell",
          cell: (m) => (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {m.subject ?? "—"}
            </span>
          ),
        },
        {
          key: "message",
          header: "Message",
          className: "max-w-[400px]",
          cell: (m) => (
            <span className="text-xs text-muted-foreground line-clamp-2">{m.message}</span>
          ),
        },
        {
          key: "status",
          header: "Status",
          cell: (m) => <StatusBadge status={m.status} />,
        },
        {
          key: "set-status",
          header: "Change",
          cell: (m) => (
            <Select
              value={m.status}
              onValueChange={(v) =>
                setStatus.mutate({ id: m.id, status: v as RequestStatus, prev: m.status })
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
          header: "Sent",
          className: "hidden lg:table-cell",
          cell: (m) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(m.created_at).toLocaleDateString("en-IN")}
            </span>
          ),
        },
      ]}
    />
  );
}
