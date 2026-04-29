import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminTab, type AdminTab } from "@/stores/dashboardTabs";
import {
  Package,
  ShoppingBag,
  FileText,
  PhoneCall,
  Mail,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(220 8% 50%)",
  ordered: "hsl(243 75% 60%)",
  in_progress: "hsl(0 84% 55%)",
  dispatched: "hsl(210 90% 56%)",
  in_transit: "hsl(220 10% 40%)",
  delivered: "hsl(142 71% 42%)",
  cancelled: "hsl(0 70% 45%)",
  returned: "hsl(280 60% 55%)",
  paid: "hsl(142 71% 42%)",
};

const Dashboard = () => {
  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const sinceMonth = new Date(Date.now() - 30 * 86400000).toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [products, lowStock, orders30, ordersToday, quotesNew, callsNew, msgsNew] =
        await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
          supabase.from("orders").select("total").gte("created_at", sinceMonth),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today.toISOString()),
          supabase
            .from("quote_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "new"),
          supabase
            .from("callback_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "new"),
          supabase
            .from("contact_messages")
            .select("*", { count: "exact", head: true })
            .eq("status", "new"),
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

  // ---- Monthly chart (revenue + orders) ----
  const { data: monthly = [] } = useQuery({
    queryKey: ["admin-monthly"],
    queryFn: async () => {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data } = await supabase
        .from("orders")
        .select("total, created_at")
        .gte("created_at", yearStart);
      const buckets = MONTHS.map((m) => ({ month: m, revenue: 0, orders: 0 }));
      (data ?? []).forEach((o: any) => {
        const m = new Date(o.created_at).getMonth();
        buckets[m].revenue += Number(o.total ?? 0);
        buckets[m].orders += 1;
      });
      // Mock fallback if completely empty
      if (buckets.every((b) => b.revenue === 0 && b.orders === 0)) {
        const sample = [
          92000, 78000, 54000, 31000, 12000, 4000, 0, 0, 0, 0, 0, 0,
        ];
        const sampleOrders = [6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0];
        return buckets.map((b, i) => ({ ...b, revenue: sample[i], orders: sampleOrders[i] }));
      }
      return buckets;
    },
  });

  // ---- Order status distribution ----
  const { data: statusDist = [] } = useQuery({
    queryKey: ["admin-status-dist"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_order_status_counts");
      if (error) throw error;
      let entries = (data ?? []).map((r: any) => ({
        name: r.status as string,
        value: Number(r.value),
      }));
      if (entries.length === 0) {
        entries = [
          { name: "ordered", value: 7 },
          { name: "delivered", value: 5 },
          { name: "in_progress", value: 2 },
          { name: "dispatched", value: 2 },
          { name: "in_transit", value: 1 },
          { name: "cancelled", value: 1 },
          { name: "returned", value: 1 },
        ];
      }
      return entries;
    },
  });

  // ---- Top products by revenue ----
  const { data: topProducts = [] } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_name, product_sku, qty, unit_price");
      const map = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
      (data ?? []).forEach((it: any) => {
        const key = it.product_sku ?? it.product_name;
        const existing = map.get(key) ?? {
          name: it.product_name,
          sku: it.product_sku ?? "",
          qty: 0,
          revenue: 0,
        };
        existing.qty += Number(it.qty ?? 0);
        existing.revenue += Number(it.qty ?? 0) * Number(it.unit_price ?? 0);
        map.set(key, existing);
      });
      let arr = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      if (arr.length === 0) {
        arr = [
          { name: "Amaron Hi-Life 65Ah", sku: "AMR-HL-65", qty: 12, revenue: 96000 },
          { name: "Exide Mileage 70Ah", sku: "EXD-ML-70", qty: 8, revenue: 72000 },
          { name: "Power Zone 100Ah Tubular", sku: "PZ-TUB-100", qty: 5, revenue: 65000 },
          { name: "Elito Inverter 150Ah", sku: "ELT-INV-150", qty: 4, revenue: 48000 },
          { name: "Amaron Pro 80Ah", sku: "AMR-PRO-80", qty: 3, revenue: 30000 },
        ];
      }
      return arr;
    },
  });

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Kpi icon={IndianRupee} label="Revenue (30d)" value={kpis ? formatINR(kpis.revenue) : "—"} tab="orders" />
        <Kpi icon={ShoppingBag} label="Orders Today" value={kpis?.ordersToday ?? "—"} tab="orders" />
        <Kpi icon={Package} label="Products" value={kpis?.productCount ?? "—"} tab="products" />
        <Kpi icon={AlertTriangle} label="Low Stock" value={kpis?.lowStock ?? "—"} tab="products" tone="warn" />
        <Kpi icon={FileText} label="New Quotes" value={kpis?.quotesNew ?? "—"} tab="quotes" />
        <Kpi icon={PhoneCall} label="Callbacks" value={kpis?.callsNew ?? "—"} tab="messages" />
        <Kpi icon={Mail} label="Messages" value={kpis?.msgsNew ?? "—"} tab="messages" />
      </div>

      {/* Revenue + Orders chart */}
      <div className="bg-card border border-line rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display-tight font-bold text-lg">Revenue & Orders ({new Date().getFullYear()})</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly trend across the current year</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `₹${v >= 1000 ? v / 1000 + "k" : v}`}
              />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--success))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--line))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: any, name: string) =>
                  name === "Revenue" ? [formatINR(Number(value)), name] : [value, name]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revFill)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Top products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-lg p-5">
          <h2 className="font-display-tight font-bold text-lg mb-4">Order Status Distribution</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={0}
                  outerRadius={110}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                >
                  {statusDist.map((entry: any) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--line))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-line rounded-lg p-5">
          <h2 className="font-display-tight font-bold text-lg mb-4">Top Products by Revenue</h2>
          <ol className="space-y-1">
            {topProducts.map((p: any, i: number) => (
              <li
                key={p.sku || p.name}
                className="flex items-center gap-3 py-2 border-b border-line last:border-0"
              >
                <div className="h-7 w-7 rounded-full bg-muted text-foreground grid place-items-center text-xs font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.qty} sold {p.sku ? `· ${p.sku}` : ""}
                  </div>
                </div>
                <div className="font-display-tight font-bold text-sm">{formatINR(p.revenue)}</div>
              </li>
            ))}
            {topProducts.length === 0 && (
              <li className="text-sm text-muted-foreground py-6 text-center">No sales data yet.</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
};

const Kpi = ({
  icon: Icon,
  label,
  value,
  tab,
  tone,
}: {
  icon: any;
  label: string;
  value: any;
  tab: AdminTab;
  tone?: "warn";
}) => {
  const setTab = useAdminTab((s) => s.setTab);
  return (
    <button
      type="button"
      onClick={() => setTab(tab)}
      className="bg-card border border-line rounded-lg p-3 hover:border-primary/40 hover:shadow-card transition-all text-left"
    >
      <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
        <Icon className={`h-3.5 w-3.5 ${tone === "warn" ? "text-warning" : ""}`} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 font-display-tight font-bold text-xl truncate">{value}</div>
    </button>
  );
};

export default Dashboard;
