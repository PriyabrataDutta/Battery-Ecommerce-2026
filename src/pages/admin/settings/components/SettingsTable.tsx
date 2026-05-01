import { EntityTable } from "@/components/admin/EntityTable";
import type { SiteSettingRow } from "@/api/admin/settings";

export function SettingsTable({
  rows,
  loading,
  onRowClick,
  onCreate,
}: {
  rows: SiteSettingRow[];
  loading: boolean;
  onRowClick: (s: SiteSettingRow) => void;
  onCreate: () => void;
}) {
  return (
    <EntityTable
      rows={rows.map((r) => ({ ...r, id: r.key }))}
      loading={loading}
      onRowClick={(r) => onRowClick(r as unknown as SiteSettingRow)}
      emptyTitle="No settings yet"
      emptyDescription="Add a key/value pair to control runtime behaviour from the storefront."
      emptyAction={{ label: "New setting", onClick: onCreate }}
      columns={[
        {
          key: "key",
          header: "Key",
          cell: (r) => <span className="font-mono text-sm">{r.key}</span>,
        },
        {
          key: "value",
          header: "Value (JSON)",
          className: "max-w-[520px]",
          cell: (r) => (
            <code className="text-[11px] text-muted-foreground line-clamp-2 break-all">
              {JSON.stringify(r.value)}
            </code>
          ),
        },
        {
          key: "updated",
          header: "Updated",
          className: "hidden md:table-cell",
          cell: (r) => (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(r.updated_at).toLocaleString("en-IN")}
            </span>
          ),
        },
      ]}
    />
  );
}
