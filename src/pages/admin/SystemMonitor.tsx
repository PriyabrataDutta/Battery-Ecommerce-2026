import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, HardDrive, Users, Package, ShoppingBag } from "lucide-react";
import { formatBytes } from "@/lib/adminLog";
import { Loader2 } from "lucide-react";

const SystemMonitor = () => {
  const { data: counts, isLoading: cLoading } = useQuery({
    queryKey: ["sys-counts"],
    queryFn: async () => {
      const [products, orders, users, brands, categories] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("battery_brands").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
      ]);
      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        users: users.count ?? 0,
        brands: brands.count ?? 0,
        categories: categories.count ?? 0,
      };
    },
  });

  const { data: storage = [], isLoading: sLoading } = useQuery({
    queryKey: ["sys-storage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_storage_usage");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display-tight font-bold text-xl mb-3">Database</h2>
        {cLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat icon={Package} label="Products" value={counts?.products} />
            <Stat icon={ShoppingBag} label="Orders" value={counts?.orders} />
            <Stat icon={Users} label="Users" value={counts?.users} />
            <Stat icon={Database} label="Brands" value={counts?.brands} />
            <Stat icon={Database} label="Categories" value={counts?.categories} />
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display-tight font-bold text-xl mb-3">Storage</h2>
        {sLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <div className="bg-card border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-line">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Bucket</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Files</th>
                  <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Size</th>
                </tr>
              </thead>
              <tbody>
                {storage.map((b: any) => (
                  <tr key={b.bucket_id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 text-muted-foreground" /> {b.bucket_id}</td>
                    <td className="px-4 py-3 text-right">{b.file_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatBytes(Number(b.total_bytes))}</td>
                  </tr>
                ))}
                {storage.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">No files in storage yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border border-line rounded-lg p-5 text-sm text-muted-foreground">
        <p>Health checks and edge function logs are available in your hosting console.</p>
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="bg-card border border-line rounded-lg p-4">
    <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <div className="mt-1 font-display-tight font-bold text-2xl">{value ?? "—"}</div>
  </div>
);

export default SystemMonitor;
