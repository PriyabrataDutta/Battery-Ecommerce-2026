import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/hooks/queries/useOrders";
import { formatINR } from "@/lib/format";
import { Package, ChevronRight } from "lucide-react";

const AccountOrders = () => {
  const { user } = useAuth();
  const { data: orders, isLoading } = useMyOrders(user?.id);


  return (
    <div className="bg-white border border-line">
      <div className="p-5 border-b border-line flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold uppercase tracking-wide text-sm">Order history</h2>
      </div>

      {orders === null ? (
        <p className="p-6 text-sm text-muted-foreground">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link to="/shop" className="text-primary hover:underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id} className="p-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold">{o.order_number ?? o.id.slice(0, 8)}</span>
                  <span className="text-[10px] uppercase tracking-wider font-display font-bold bg-muted px-1.5 py-0.5">
                    {o.status}
                  </span>
                  {o.promo_code && (
                    <span className="text-[10px] uppercase tracking-wider font-display font-bold bg-success/10 text-success px-1.5 py-0.5">
                      {o.promo_code}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(o.created_at).toLocaleString()}
                  {o.delivery_label && <> · {o.delivery_label}</>}
                </div>
                {o.scheduled_date && (
                  <div className="text-xs text-muted-foreground">
                    Scheduled {new Date(o.scheduled_date).toLocaleDateString()}{" "}
                    {o.scheduled_slot_label && `· ${o.scheduled_slot_label} (${o.scheduled_slot_window})`}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold">{formatINR(Number(o.total))}</div>
                {Number(o.discount) > 0 && (
                  <div className="text-[11px] text-success">−{formatINR(Number(o.discount))} saved</div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AccountOrders;
