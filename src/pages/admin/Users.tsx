import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityTable } from "@/components/admin/EntityTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ROLES = ["customer", "staff", "admin"] as const;

const Users = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? rows.filter((r: any) =>
          [r.full_name, r.email, r.phone, r.company].some((v) => (v ?? "").toLowerCase().includes(q))
        )
      : rows;
  }, [rows, search]);

  const setRole = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { error } = await supabase.rpc("admin_set_user_role", { _user_id: user_id, _role: role as any });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <AdminPageHeader title="Users" count={filtered.length} search={search} onSearch={setSearch} />
      <EntityTable
        loading={isLoading}
        rows={filtered}
        emptyTitle="No users yet"
        columns={[
          { key: "user", header: "User", cell: (u: any) => (
            <div>
              <div className="font-semibold">{u.full_name ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground">{u.email}</div>
            </div>
          )},
          { key: "phone", header: "Phone", cell: (u: any) => <span className="text-xs">{u.phone ?? "—"}</span> },
          { key: "company", header: "Company", cell: (u: any) => <span className="text-xs">{u.company ?? "—"}</span> },
          {
            key: "roles",
            header: "Role",
            cell: (u: any) => (
              <Select value={u.roles?.[0] ?? "customer"} onValueChange={(v) => setRole.mutate({ user_id: u.id, role: v })}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            ),
          },
          { key: "joined", header: "Joined", cell: (u: any) => <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span> },
        ]}
      />
    </>
  );
};

export default Users;
