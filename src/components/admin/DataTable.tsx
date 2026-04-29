import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  empty?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  rows,
  columns,
  searchKeys,
  onRowClick,
  empty = "No records.",
  pageSize = 25,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = q && searchKeys?.length
    ? rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
      )
    : rows;

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="bg-white border border-line">
      {searchKeys?.length ? (
        <div className="p-3 border-b border-line flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Search…"
            className="h-9 border-0 shadow-none focus-visible:ring-0 px-0"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">{filtered.length} records</span>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-12 text-muted-foreground">{empty}</td></tr>
            ) : visible.map((row, i) => (
              <tr
                key={(row.id as string) ?? i}
                className={`border-t border-line ${onRowClick ? "cursor-pointer hover:bg-muted/40" : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 align-middle ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between p-3 border-t border-line text-xs">
          <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 border border-line disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} className="px-2 py-1 border border-line disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
