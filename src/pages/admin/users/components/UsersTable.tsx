import { EntityTable } from "@/components/admin/EntityTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUserRow } from "@/api/admin/users";
import { useSetUserRole } from "../hooks/useAdminUsers";

const TONE: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-amber-100 text-amber-800 border-amber-200",
  customer: "bg-slate-100 text-slate-700 border-slate-200",
};

export function UsersTable({
  rows,
  loading,
}: {
  rows: AdminUserRow[];
  loading: boolean;
}) {
  const setRole = useSetUserRole();

  return (
    <EntityTable
      rows={rows}
      loading={loading}
      emptyTitle="No users found"
      emptyDescription="No users match the current filters."
      columns={[
        {
          key: "user",
          header: "User",
          cell: (u) => (
            <div className="min-w-0">
              <div className="font-semibold truncate">{u.full_name || "—"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
            </div>
          ),
        },
        {
          key: "phone",
          header: "Phone",
          className: "hidden md:table-cell",
          cell: (u) => (
            <span className="text-xs text-muted-foreground">{u.phone ?? "—"}</span>
          ),
        },
        {
          key: "company",
          header: "Company",
          className: "hidden lg:table-cell",
          cell: (u) => (
            <span className="text-xs text-muted-foreground">{u.company ?? "—"}</span>
          ),
        },
        {
          key: "roles",
          header: "Roles",
          cell: (u) => (
            <div className="flex flex-wrap gap-1">
              {u.roles.length === 0 ? (
                <span className="text-[11px] text-muted-foreground">none</span>
              ) : (
                u.roles.map((r) => (
                  <span
                    key={r}
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${
                      TONE[r] ?? "bg-muted text-foreground border-line"
                    }`}
                  >
                    {r}
                  </span>
                ))
              )}
            </div>
          ),
        },
        {
          key: "set-role",
          header: "Change role",
          cell: (u) => (
            <Select
              value={u.roles[0] ?? ""}
              onValueChange={(v) =>
                setRole.mutate({ userId: u.id, role: v as "admin" | "staff" | "customer" })
              }
              disabled={setRole.isPending}
            >
              <SelectTrigger
                className="h-8 w-[130px] text-xs capitalize"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder="Set role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer" className="text-xs">Customer</SelectItem>
                <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
              </SelectContent>
            </Select>
          ),
        },
        {
          key: "created",
          header: "Joined",
          className: "hidden xl:table-cell",
          cell: (u) => (
            <span className="text-xs text-muted-foreground">
              {new Date(u.created_at).toLocaleDateString("en-IN")}
            </span>
          ),
        },
      ]}
    />
  );
}
