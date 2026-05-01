import { useState } from "react";
import { OrdersToolbar, type OrdersFilterState } from "./components/OrdersToolbar";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDetailDrawer } from "./components/OrderDetailDrawer";
import { useAdminOrdersQuery } from "./hooks/useAdminOrders";
import type { AdminOrderRow } from "@/api/admin/orders";

/**
 * AdminOrders (orchestrator)
 * ==============================================================
 * Orders surface in the Admin Dashboard.
 *
 * FILE MAP
 *   index.tsx                    ← you are here (state + composition)
 *   components/
 *     OrdersToolbar.tsx          ← search + status filter
 *     OrdersTable.tsx            ← list view
 *     OrderDetailDrawer.tsx      ← detail + status / notes editing
 *   hooks/
 *     useAdminOrders.ts          ← React Query hooks + mutations
 *
 * COMMON EDITS
 *   • Add a list column          → components/OrdersTable.tsx
 *   • Add a filter               → OrdersToolbar.tsx + ListAdminOrdersOptions
 *   • Add a per-order action     → OrderDetailDrawer.tsx (use existing hooks
 *                                   or add a new one in useAdminOrders.ts)
 *   • Add a new status           → ORDER_STATUSES in api/admin/orders.ts
 *                                   (and update StatusBadge tones if needed)
 */
const AdminOrders = () => {
  const [filters, setFilters] = useState<OrdersFilterState>({ search: "", status: "" });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<AdminOrderRow | null>(null);

  const ordersQuery = useAdminOrdersQuery({
    search: filters.search || undefined,
    status: filters.status || undefined,
  });

  const handleRowClick = (o: AdminOrderRow) => {
    setActive(o);
    setOpen(true);
  };

  // Keep the drawer's `order` prop in sync with the latest list row so status
  // changes coming back from the server are reflected without re-opening.
  const liveActive = active
    ? ordersQuery.data?.find((o) => o.id === active.id) ?? active
    : null;

  return (
    <div className="space-y-3">
      <OrdersToolbar
        state={filters}
        onChange={setFilters}
        count={ordersQuery.data?.length ?? 0}
      />
      <OrdersTable
        rows={ordersQuery.data ?? []}
        loading={ordersQuery.isLoading}
        onRowClick={handleRowClick}
      />
      <OrderDetailDrawer open={open} onOpenChange={setOpen} order={liveActive} />
    </div>
  );
};

export default AdminOrders;
