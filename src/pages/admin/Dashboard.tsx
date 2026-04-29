import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, FileText, PhoneCall, Mail, AlertTriangle } from "lucide-react";
import { formatINR } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";

const Dashboard = () => {
  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const sinceMonth = new Date(Date.now() - 30 * 86400000).toISOString();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [products, lowStock, orders30, ordersToday, quotesNew, callsNew, msgsNew] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
        supabase.from("orders").select("total").gte("created_at", sinceMonth),
        supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("callback_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      const revenue = (orders30.data ?? []).reduce((s, r: any) => s + Number(r.total ?? 0), 0);
      return {
        productCount: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        revenue,
        ordersToday: ordersToday.count ?? 0,
        quotesNew: quotesNew.count ?? 0,
        callsNew: callsNew.count ?? 0,
        msgsNew: msgsNew.count ?? 0,
      };
    },
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, created_at, customer_name, total, status")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: recentQuotes = [] } = useQuery({
    queryKey: ["admin-recent-quotes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quote_requests")
        .select("id, created_at, name, company, status")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Package} label="Products" value={kpis?.productCount ?? "—"} to="/admin/products" />
        <Kpi icon={AlertTriangle} label="Low Stock (<5)" value={kpis?.lowStock ?? "—"} to="/admin/products" tone="warn" />
        <Kpi icon={ShoppingBag} label="Revenue (30d)" value={kpis ? formatINR(kpis.revenue) : "—"} to="/admin/orders" />
        <Kpi icon={ShoppingBag} label="Orders Today" value={kpis?.ordersToday ?? "—"} to="/admin/orders" />
        <Kpi icon={FileText} label="New Quotes" value={kpis?.quotesNew ?? "—"} to="/admin/quotes" />
        <Kpi icon={PhoneCall} label="Callback Requests" value={kpis?.callsNew ?? "—"} to="/admin/callbacks" />
        <Kpi icon={Mail} label="New Messages" value={kpis?.msgsNew ?? "—"} to="/admin/messages" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Recent Orders" empty="No orders yet.">
          {recentOrders.map((o: any) => (
            <Link to={`/admin/orders`} key={o.id} className="flex items-center justify-between py-2 border-b border-line last:border-0 hover:text-primary">
              <div>
                <div className="font-semibold text-sm">{o.customer_name ?? "Guest"}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={o.status} />
                <span className="font-bold">{formatINR(o.total)}</span>
              </div>
            </Link>
          ))}
        </Panel>
        <Panel title="Recent Quote Requests" empty="No quote requests.">
          {recentQuotes.map((q: any) => (
            <Link to={`/admin/quotes`} key={q.id} className="flex items-center justify-between py-2 border-b border-line last:border-0 hover:text-primary">
              <div>
                <div className="font-semibold text-sm">{q.name}</div>
                <div className="text-[11px] text-muted-foreground">{q.company ?? "—"} · {new Date(q.created_at).toLocaleString()}</div>
              </div>
              <StatusBadge status={q.status} />
            </Link>
          ))}
        </Panel>
      </div>
    </div>
  );
};

function Kpi({ icon: Icon, label, value, to, tone }: { icon: any; label: string; value: any; to: string; tone?: "warn" }) {
  return (
    <Link to={to} className={`bg-white border border-line p-4 hover:border-ink transition-colors ${tone === "warn" ? "border-amber-300" : ""}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="font-display-tight font-bold text-2xl mt-1">{value}</div>
    </Link>
  );
}

function Panel({ title, children, empty }: { title: string; children: React.ReactNode; empty: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="bg-white border border-line p-5">
      <h2 className="font-display font-bold uppercase tracking-wider text-sm mb-3">{title}</h2>
      {hasChildren ? children : <div className="text-muted-foreground text-sm py-6 text-center">{empty}</div>}
    </div>
  );
}

export default Dashboard;
