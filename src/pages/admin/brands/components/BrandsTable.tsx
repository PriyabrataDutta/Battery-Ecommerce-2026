import { EntityTable } from "@/components/admin/EntityTable";
import { Image as ImageIcon } from "lucide-react";
import type { AdminBrandRow } from "@/api/admin/brands";

export function BrandsTable({
  rows,
  loading,
  onRowClick,
  onCreate,
}: {
  rows: AdminBrandRow[];
  loading: boolean;
  onRowClick: (b: AdminBrandRow) => void;
  onCreate: () => void;
}) {
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      onRowClick={onRowClick}
      emptyTitle="No brands yet"
      emptyDescription="Add the first battery brand to power the storefront filters."
      emptyAction={{ label: "New brand", onClick: onCreate }}
      columns={[
        {
          key: "logo",
          header: "",
          className: "w-12",
          cell: (b) =>
            b.logo_url ? (
              <img src={b.logo_url} alt={b.name} className="h-9 w-9 object-contain bg-muted rounded" />
            ) : (
              <div className="h-9 w-9 grid place-items-center bg-muted rounded text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
            ),
        },
        {
          key: "name",
          header: "Brand",
          cell: (b) => (
            <div>
              <div className="font-semibold">{b.name}</div>
              <div className="text-[11px] text-muted-foreground">/{b.slug}</div>
            </div>
          ),
        },
        {
          key: "description",
          header: "Description",
          className: "hidden md:table-cell",
          cell: (b) => (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {b.description ?? "—"}
            </span>
          ),
        },
        {
          key: "sort",
          header: "Sort",
          cell: (b) => <span className="text-xs">{b.sort_order}</span>,
        },
      ]}
    />
  );
}
