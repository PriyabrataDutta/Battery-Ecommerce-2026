import { ReactNode } from "react";
import { Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EntityTable<T extends { id?: string | number }>({
  rows,
  columns,
  loading,
  onRowClick,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
}: {
  rows: T[];
  columns: { key: string; header: string; cell: (row: T) => ReactNode; className?: string }[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
}) {
  if (loading) {
    return (
      <div className="bg-card border border-line rounded-lg p-12 text-center">
        <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-card border border-line rounded-lg p-12 text-center">
        <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-display-tight font-bold text-lg">{emptyTitle}</h3>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{emptyDescription}</p>
        )}
        {emptyAction && (
          <Button onClick={emptyAction.onClick} className="mt-4">
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-line rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-line">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`text-left px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground ${c.className ?? ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={(row.id as any) ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-line last:border-0 ${onRowClick ? "cursor-pointer hover:bg-muted/30" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
