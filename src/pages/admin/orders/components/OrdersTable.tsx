import { EntityTable } from "@/components/admin/EntityTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatINR } from "@/lib/format";
import type { AdminOrderRow } from "@/api/admin/orders";

/**
 * OrdersTable
 * --------------------------------------------------------------
 * Compact list of all orders. Click a row to open the detail
 * drawer. Status changes happen inside the drawer (not inline)
 * so the row click target stays unambiguous.
 */
export function OrdersTable({
  rows,
  loading,
  onRowClick,
}: {
  rows: AdminOrderRow[];
  loading: boolean;
  onRowClick: (o: AdminOrderRow) => void;
}) {
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      onRowClick={onRowClick}
      emptyTitle="No orders match"
      emptyDescription="Try clearing the filters above."
      columns={[
        {
          key: "number",
          header: "Order",
          cell: (o) => (
            <div className="min-w-0">
              <div className="font-display font-bold">#{o.order_number ?? o.id.slice(0, 8)}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(o.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
          ),
        },
        {
          key: "customer",
          header: "Customer",
          cell: (o) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{o.customer_name ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {o.customer_email ?? o.customer_phone ?? "—"}
              </div>
            </div>
          ),
        },
        {
          key: "delivery",
          header: "Delivery",
          className: "hidden md:table-cell",
          cell: (o) => (
            <div className="text-xs">
              <div>{o.delivery_label ?? "—"}</div>
              {o.scheduled_date && (
                <div className="text-[11px] text-muted-foreground">
                  {o.scheduled_date} · {o.scheduled_slot_label}
                </div>
              )}
            </div>
          ),
        },
        {
          key: "total",
          header: "Total",
          cell: (o) => <span className="font-semibold">{formatINR(Number(o.total))}</span>,
        },
        {
          key: "status",
          header: "Status",
          cell: (o) => <StatusBadge status={o.status} />,
        },
      ]}
    />
  );
}
