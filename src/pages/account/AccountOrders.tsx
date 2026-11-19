import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canPayOnline } from "@/api/orders";
import { payOnline } from "@/lib/cashfree";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/hooks/queries/useOrders";
import { formatINR } from "@/lib/format";
import { Package, ChevronRight, Loader2 } from "lucide-react";

const AccountOrders = () => {
  const { user } = useAuth();
  const { data: orders, isLoading } = useMyOrders(user?.id);
  const [paying, setPaying] = useState<string | null>(null);

  // Ownership, eligibility and the amount are all checked server-side (cashfree-order).
  const pay = async (orderNumber: string) => {
    setPaying(orderNumber);
    try {
      await payOnline(orderNumber);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the payment. Please try again.");
      setPaying(null);
    }
  };

  return (
    <div className="surface">
      <div className="p-5 border-b border-line flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Order history</h2>
      </div>

      {isLoading || !orders ? (
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
                  <span className="text-[11px] font-semibold bg-muted rounded-full px-2 py-0.5">
                    {o.status}
                  </span>
                  {o.promo_code && (
                    <span className="text-[11px] font-semibold bg-success/10 text-success rounded-full px-2 py-0.5">
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
                {o.order_number && canPayOnline(o) && (
                  <Button size="sm" className="mt-2 h-7 text-xs" disabled={!!paying} onClick={() => pay(o.order_number!)}>
                    {paying === o.order_number && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Pay now
                  </Button>
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
