import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Package, MapPin, Heart, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  created_at: string;
}

const AccountOverview = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [counts, setCounts] = useState({ orders: 0, addresses: 0, wishlist: 0, quotes: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [o, addr, wish, q] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, status, total, created_at", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("customer_addresses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("wishlist_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("quote_requests")
          .select("id", { count: "exact", head: true })
          .eq("email", user.email ?? ""),
      ]);
      setOrders((o.data ?? []) as OrderRow[]);
      setCounts({
        orders: o.count ?? 0,
        addresses: addr.count ?? 0,
        wishlist: wish.count ?? 0,
        quotes: q.count ?? 0,
      });
    })();
  }, [user]);

  const tiles = [
    { label: "Orders", value: counts.orders, icon: Package, to: "/account/orders" },
    { label: "Addresses", value: counts.addresses, icon: MapPin, to: "/account/addresses" },
    { label: "Wishlist", value: counts.wishlist, icon: Heart, to: "/account/wishlist" },
    { label: "Quotes", value: counts.quotes, icon: FileText, to: "/account/quotes" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className="bg-white border border-line p-4 hover:border-primary transition-colors group"
          >
            <t.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-2xl font-display-tight font-bold">{t.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-display font-semibold">
              {t.label}
            </div>
          </Link>
        ))}
      </div>

      <section className="bg-white border border-line p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold uppercase tracking-wide text-sm">
            Recent orders
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/account/orders">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
        {orders === null ? (
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
