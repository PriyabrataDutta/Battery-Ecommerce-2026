import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccountOverview } from "@/hooks/queries/useOrders";
import { formatINR } from "@/lib/format";
import { Package, MapPin, Heart, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccountTab, type AccountTab } from "@/stores/dashboardTabs";

const AccountOverview = () => {
  const { user } = useAuth();
  const { data, isLoading } = useAccountOverview(user?.id, user?.email ?? null);
  const orders = data?.recentOrders ?? null;
  const counts = data?.counts ?? { orders: 0, addresses: 0, wishlist: 0, quotes: 0 };

  const setTab = useAccountTab((s) => s.setTab);
  const tiles: { label: string; value: number; icon: typeof Package; tab: AccountTab }[] = [
    { label: "Orders", value: counts.orders, icon: Package, tab: "orders" },
    { label: "Addresses", value: counts.addresses, icon: MapPin, tab: "addresses" },
    { label: "Wishlist", value: counts.wishlist, icon: Heart, tab: "wishlist" },
    { label: "Quotes", value: counts.quotes, icon: FileText, tab: "quotes" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(t.tab)}
            className="surface p-4 sm:p-5 hover:border-primary/40 transition-colors group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <t.icon className="h-5 w-5" />
            </span>
            <div className="mt-4 text-3xl font-display-tight font-bold">{t.value}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {t.label}
            </div>
          </button>
        ))}
      </div>

      <section className="surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display-tight text-xl font-bold">
            Recent orders
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setTab("orders")}>
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {isLoading || orders === null ? (
          <p className="text-sm text-muted-foreground mt-4">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">
            No orders yet.{" "}
            <Link to="/shop" className="text-primary hover:underline">
              Browse batteries
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-mono font-semibold">{o.order_number ?? o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()} · {o.status}
                  </div>
                </div>
                <div className="font-bold whitespace-nowrap">{formatINR(Number(o.total))}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AccountOverview;
