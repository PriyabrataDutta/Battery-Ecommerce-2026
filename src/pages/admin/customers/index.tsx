import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityTable } from "@/components/admin/EntityTable";
import { Input } from "@/components/ui/input";
import { Search, UserCheck, Phone, PhoneOff } from "lucide-react";

interface CustomerRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  phone_verified: boolean;
  created_at: string;
}

const CUSTOMERS_KEY = ["admin", "customers"] as const;

function useCustomersQuery() {
  return useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: async (): Promise<CustomerRow[]> => {
      const { data, error } = await supabase.rpc("admin_list_customers");
      if (error) throw error;
      return (data ?? []) as CustomerRow[];
    },
    staleTime: 10_000,
  });
}

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const q = useCustomersQuery();

  const filtered = (q.data ?? []).filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.full_name ?? "").toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.phone ?? "").includes(s) ||
      (c.company ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers…"
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <EntityTable
        rows={filtered}
        loading={q.isLoading}
        emptyTitle="No customers yet"
        emptyDescription="Customers will appear here once they sign up."
        columns={[
          {
            key: "customer",
            header: "Customer",
            cell: (c) => (
              <div className="min-w-0">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  {c.full_name || "—"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{c.email}</div>
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            className: "hidden md:table-cell",
            cell: (c) => (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{c.phone ?? "—"}</span>
                {c.phone && (
                  c.phone_verified
                    ? <Phone className="h-3 w-3 text-emerald-500" />
                    : <PhoneOff className="h-3 w-3 text-muted-foreground/50" />
                )}
              </div>
            ),
          },
          {
            key: "company",
            header: "Company",
            className: "hidden lg:table-cell",
            cell: (c) => (
              <span className="text-xs text-muted-foreground">{c.company ?? "—"}</span>
            ),
          },
          {
            key: "verified",
            header: "Verified",
            className: "hidden sm:table-cell",
            cell: (c) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded ${
                  c.phone_verified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {c.phone_verified ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "joined",
            header: "Joined",
            className: "hidden xl:table-cell",
            cell: (c) => (
              <span className="text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString("en-IN")}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AdminCustomers;
