import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, FileText, PhoneCall, Mail, AlertTriangle, IndianRupee } from "lucide-react";
import { formatINR } from "@/lib/format";

const Overview = () => {
  const { data: kpis } = useQuery({
    queryKey: ["overview-kpis"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const yest = new Date(start); yest.setDate(yest.getDate() - 1);
      const [products, lowStock, ordersToday, ordersYest, quotes, calls, msgs] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
        supabase.from("orders").select("total").gte("created_at", start.toISOString()),
        supabase.from("orders").select("total").gte("created_at", yest.toISOString()).lt("created_at", start.toISOString()),
        supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("callback_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      const sum = (r: any) => (r.data ?? []).reduce((s: number, x: any) => s + Number(x.total ?? 0), 0);
      return {
        products: products.count ?? 0,
        lowStock: lowStock.count ?? 0,
        revenueToday: sum(ordersToday),
        revenueYest: sum(ordersYest),
        ordersToday: ordersToday.data?.length ?? 0,
        ordersYest: ordersYest.data?.length ?? 0,
        quotes: quotes.count ?? 0,
        calls: calls.count ?? 0,
        msgs: msgs.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Compare label="Revenue" today={kpis ? formatINR(kpis.revenueToday) : "—"} yest={kpis ? formatINR(kpis.revenueYest) : "—"} />
        <Compare label="Orders" today={kpis?.ordersToday ?? "—"} yest={kpis?.ordersYest ?? "—"} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Quick icon={Package} label="Products" value={kpis?.products} to="/admin/products" />
        <Quick icon={AlertTriangle} label="Low stock" value={kpis?.lowStock} to="/admin/products" tone="warn" />
        <Quick icon={FileText} label="New quotes" value={kpis?.quotes} to="/admin/quotes" />
        <Quick icon={PhoneCall} label="Callbacks" value={kpis?.calls} to="/admin/callbacks" />
        <Quick icon={Mail} label="Messages" value={kpis?.msgs} to="/admin/messages" />
        <Quick icon={ShoppingBag} label="Orders today" value={kpis?.ordersToday} to="/admin/orders" />
      </div>
    </div>
  );
};

const Compare = ({ label, today, yest }: any) => (
  <div className="bg-card border border-line rounded-lg p-5">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
    <div className="mt-1 flex items-end gap-4">
      <div>
        <div className="text-[10px] text-muted-foreground">Today</div>
        <div className="font-display-tight font-bold text-2xl">{today}</div>
      </div>
      <div className="text-muted-foreground">
        <div className="text-[10px]">Yesterday</div>
        <div className="font-display-tight text-lg">{yest}</div>
      </div>
    </div>
  </div>
);

const Quick = ({ icon: Icon, label, value, to, tone }: any) => (
  <Link to={to} className="bg-card border border-line rounded-lg p-3 hover:border-primary/40 hover:shadow-card transition-all">
    <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
      <Icon className={`h-3.5 w-3.5 ${tone === "warn" ? "text-warning" : ""}`} />
      <span className="truncate">{label}</span>
    </div>
    <div className="mt-1.5 font-display-tight font-bold text-xl">{value ?? "—"}</div>
  </Link>
);

export default Overview;
