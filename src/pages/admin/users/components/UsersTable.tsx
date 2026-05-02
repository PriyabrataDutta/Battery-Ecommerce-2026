import { useState } from "react";
import { EntityTable } from "@/components/admin/EntityTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import type { AdminUserRow } from "@/api/admin/users";
import { useSetUserRole } from "../hooks/useAdminUsers";
import { PermissionsEditor } from "./PermissionsEditor";
import { useMyPermissions } from "@/hooks/usePermissions";

const TONE: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-amber-100 text-amber-800 border-amber-200",
};

export function UsersTable({
  rows,
  loading,
}: {
  rows: AdminUserRow[];
  loading: boolean;
}) {
  const setRole = useSetUserRole();
  const { isAdmin } = useMyPermissions();
  const [permTarget, setPermTarget] = useState<{ id: string; name: string } | null>(null);

  // Filter to only show admin/staff users (not customers)
  const teamRows = rows.filter((u) =>
    u.roles.some((r) => r === "admin" || r === "staff")
  );

  return (
    <>
      <EntityTable
        rows={teamRows}
        loading={loading}
        emptyTitle="No team members found"
        emptyDescription="Invite staff or admin members to get started."
        columns={[
          {
            key: "user",
            header: "Team Member",
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
            key: "roles",
            header: "Role",
            cell: (u) => (
              <div className="flex flex-wrap gap-1">
                {u.roles.filter((r) => r !== "customer").map((r) => (
                  <span
                    key={r}
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${
                      TONE[r] ?? "bg-muted text-foreground border-line"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: "set-role",
            header: "Change Role",
            cell: (u) => (
              <Select
                value={u.roles.find((r) => r === "admin" || r === "staff") ?? "staff"}
                onValueChange={(v) =>
                  setRole.mutate({ userId: u.id, role: v as "admin" | "staff" })
                }
                disabled={setRole.isPending || !isAdmin}
              >
                <SelectTrigger
                  className="h-8 w-[120px] text-xs capitalize"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder="Set role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                  <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
          {
            key: "permissions",
            header: "Permissions",
            cell: (u) => {
              const isStaffUser = u.roles.includes("staff") && !u.roles.includes("admin");
              if (!isStaffUser || !isAdmin) return null;
              return (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPermTarget({ id: u.id, name: u.full_name || u.email });
                  }}
                >
                  <Shield className="h-3 w-3" />
                  Manage
                </Button>
              );
            },
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

      {permTarget && (
        <PermissionsEditor
          userId={permTarget.id}
          userName={permTarget.name}
          open={!!permTarget}
          onOpenChange={(v) => { if (!v) setPermTarget(null); }}
        />
      )}
    </>
  );
}
