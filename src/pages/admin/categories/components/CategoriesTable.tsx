import { EntityTable } from "@/components/admin/EntityTable";
import type { AdminCategoryRow } from "@/api/admin/categories";

export function CategoriesTable({
  rows,
  loading,
  onRowClick,
  onCreate,
}: {
  rows: AdminCategoryRow[];
  loading: boolean;
  onRowClick: (c: AdminCategoryRow) => void;
  onCreate: () => void;
}) {
  // Build a quick lookup so the parent column can show a friendly name.
  const byId = new Map(rows.map((r) => [r.id, r]));
  return (
    <EntityTable
      rows={rows}
      loading={loading}
      onRowClick={onRowClick}
      emptyTitle="No categories yet"
      emptyDescription="Add the first category to organise your catalog."
      emptyAction={{ label: "New category", onClick: onCreate }}
      columns={[
        {
          key: "name",
          header: "Category",
          cell: (c) => (
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">/{c.slug}</div>
            </div>
          ),
        },
        {
          key: "parent",
          header: "Parent",
          className: "hidden md:table-cell",
          cell: (c) => (
            <span className="text-xs text-muted-foreground">
              {c.parent_id ? byId.get(c.parent_id)?.name ?? "—" : "—"}
            </span>
          ),
        },
        {
          key: "icon",
          header: "Icon",
          className: "hidden md:table-cell",
          cell: (c) => (
            <span className="text-xs text-muted-foreground">{c.icon ?? "—"}</span>
          ),
        },
        {
          key: "sort",
          header: "Sort",
          cell: (c) => <span className="text-xs">{c.sort_order}</span>,
        },
      ]}
    />
  );
}
