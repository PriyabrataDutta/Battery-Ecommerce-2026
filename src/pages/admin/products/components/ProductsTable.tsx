import { EntityTable } from "@/components/admin/EntityTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatINR } from "@/lib/format";
import { AlertTriangle, Image as ImageIcon } from "lucide-react";
import type { AdminProductRow } from "@/api/admin/products";

/**
 * ProductsTable
 * --------------------------------------------------------------
 * Thin wrapper around the shared `EntityTable` that defines the
 * columns shown in the admin Products list. Click a row to open
 * the editor drawer.
 */
export function ProductsTable({
  rows,
  loading,
  onRowClick,
  onCreate,
}: {
  rows: AdminProductRow[];
  loading: boolean;
  onRowClick: (p: AdminProductRow) => void;
  onCreate: () => void;
}) {
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      onRowClick={onRowClick}
      emptyTitle="No products found"
      emptyDescription="Try clearing filters or add your first product."
      emptyAction={{ label: "New product", onClick: onCreate }}
      columns={[
        {
          key: "image",
          header: "",
          className: "w-12",
          cell: (p) =>
            p.primary_image_url ? (
              <img
                src={p.primary_image_url}
                alt={p.name}
                className="h-9 w-9 object-cover bg-muted rounded"
              />
            ) : (
              <div className="h-9 w-9 grid place-items-center bg-muted rounded text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
            ),
        },
        {
          key: "name",
          header: "Product",
          cell: (p) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {p.battery_brands?.name ?? "No brand"} · SKU {p.sku}
              </div>
            </div>
          ),
        },
        {
          key: "category",
          header: "Category",
          className: "hidden md:table-cell",
          cell: (p) => (
            <span className="text-xs text-muted-foreground">
              {p.categories?.name ?? "—"}
            </span>
          ),
        },
        {
          key: "price",
          header: "Price",
          cell: (p) => <span className="font-semibold">{formatINR(p.price)}</span>,
        },
        {
          key: "stock",
          header: "Stock",
          cell: (p) => (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                p.stock < 5 ? "text-warning" : ""
              }`}
            >
              {p.stock < 5 && <AlertTriangle className="h-3 w-3" />} {p.stock}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          cell: (p) => <StatusBadge status={p.status} />,
        },
      ]}
    />
  );
}
