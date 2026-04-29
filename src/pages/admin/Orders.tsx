import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusPicker } from "@/components/admin/StatusPicker";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatINR } from "@/lib/format";

const ORDER_STATUSES = [
  "pending",
  "ordered",
  "in_progress",
  "dispatched",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
];

const Orders = () => {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<any>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, customer_email, customer_phone, total, status, address, notes")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (o: any) =>
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_email ?? "").toLowerCase().includes(q) ||
        (o.customer_phone ?? "").toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const exportCsv = () => {
    const header = ["id", "date", "customer", "email", "phone", "total", "status"];
    const csv = [
      header.join(","),
      ...filtered.map((o: any) =>
        [
          o.id,
          new Date(o.created_at).toISOString(),
          `"${(o.customer_name ?? "").replace(/"/g, '""')}"`,
          o.customer_email ?? "",
          o.customer_phone ?? "",
          o.total,
          o.status,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminPageHeader
        title="Orders"
        count={filtered.length}
        search={search}
        onSearch={setSearch}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No orders yet"
        emptyDescription="Customer orders will appear here as they are placed."
        onRowClick={(r) => setActive(r)}
        columns={[
          {
            key: "id",
            header: "Order",
            cell: (o: any) => <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>,
          },
          {
            key: "customer",
            header: "Customer",
            cell: (o: any) => (
              <div>
                <div className="font-semibold">{o.customer_name ?? "Guest"}</div>
                <div className="text-[11px] text-muted-foreground">{o.customer_email ?? o.customer_phone ?? "—"}</div>
              </div>
            ),
          },
          { key: "total", header: "Total", cell: (o: any) => <span className="font-semibold">{formatINR(o.total)}</span> },
          {
            key: "status",
            header: "Status",
            cell: (o: any) => (
              <div onClick={(e) => e.stopPropagation()}>
                <StatusPicker
                  value={o.status}
                  options={ORDER_STATUSES}
                  table="orders"
                  id={o.id}
                  invalidate={[["admin-orders"], ["admin-status-dist"]]}
                  entityType="order"
                />
              </div>
            ),
          },
          { key: "date", header: "Date", cell: (o: any) => <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span> },
        ]}
      />

      {active && <OrderDrawer order={active} onClose={() => setActive(null)} />}
    </>
  );
};

function OrderDrawer({ order, onClose }: { order: any; onClose: () => void }) {
  const { data: items = [] } = useQuery({
    queryKey: ["admin-order-items", order.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("id, product_name, product_sku, qty, unit_price")
        .eq("order_id", order.id);
      return data ?? [];
    },
  });

  const addr = order.address ?? {};

  return (
    <EntityDrawer open onOpenChange={(v) => !v && onClose()} title={`Order #${order.id.slice(0, 8)}`} size="lg">
      <Section title="Customer">
        <Row label="Name" value={order.customer_name ?? "—"} />
        <Row label="Email" value={order.customer_email ?? "—"} />
        <Row label="Phone" value={order.customer_phone ?? "—"} />
      </Section>

      <Section title="Status">
        <StatusPicker
          value={order.status}
          options={ORDER_STATUSES}
          table="orders"
          id={order.id}
          invalidate={[["admin-orders"], ["admin-status-dist"]]}
          entityType="order"
        />
      </Section>

      <Section title={`Items (${items.length})`}>
        <div className="border border-line rounded-md divide-y divide-line">
          {items.map((it: any) => (
            <div key={it.id} className="px-3 py-2 flex items-center justify-between text-sm">
              <div>
                <div className="font-semibold">{it.product_name}</div>
                <div className="text-[11px] text-muted-foreground">{it.product_sku ?? ""} · qty {it.qty}</div>
              </div>
              <div className="font-semibold">{formatINR(Number(it.qty) * Number(it.unit_price))}</div>
            </div>
          ))}
          {items.length === 0 && <div className="px-3 py-4 text-sm text-muted-foreground">No items.</div>}
        </div>
        <div className="flex justify-end mt-2 font-display-tight font-bold">Total: {formatINR(order.total)}</div>
      </Section>

      {(addr.line1 || addr.city) && (
        <Section title="Shipping address">
          <div className="text-sm whitespace-pre-line">
            {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join("\n")}
          </div>
        </Section>
      )}

      {order.notes && (
        <Section title="Notes">
          <div className="text-sm whitespace-pre-line">{order.notes}</div>
        </Section>
      )}
    </EntityDrawer>
  );
}

const Section = ({ title, children }: any) => (
  <div>
    <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">{title}</div>
    {children}
  </div>
);
const Row = ({ label, value }: any) => (
  <div className="flex justify-between text-sm py-0.5">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Orders;
