import { EntityTable } from "@/components/admin/EntityTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminQuoteRow } from "@/api/admin/quotes";

export function QuotesTable({
  rows,
  loading,
  onRowClick,
}: {
  rows: AdminQuoteRow[];
  loading: boolean;
  onRowClick: (q: AdminQuoteRow) => void;
}) {
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      onRowClick={onRowClick}
      emptyTitle="No quote requests"
      emptyDescription="When customers submit the quote form, they'll appear here."
      columns={[
        {
          key: "who",
          header: "Customer",
          cell: (q) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{q.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {q.email} · {q.phone}
              </div>
            </div>
          ),
        },
        {
          key: "company",
          header: "Company",
          className: "hidden md:table-cell",
          cell: (q) => (
            <span className="text-xs text-muted-foreground">{q.company ?? "—"}</span>
          ),
        },
        {
          key: "requirement",
          header: "Requirement",
          className: "hidden lg:table-cell max-w-[320px]",
          cell: (q) => (
            <span className="text-xs text-muted-foreground line-clamp-2">{q.requirement}</span>
          ),
        },
        {
          key: "status",
          header: "Status",
          cell: (q) => <StatusBadge status={q.status} />,
        },
        {
          key: "created",
          header: "Submitted",
          className: "hidden md:table-cell",
          cell: (q) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(q.created_at).toLocaleDateString("en-IN")}
            </span>
          ),
        },
      ]}
    />
  );
}
