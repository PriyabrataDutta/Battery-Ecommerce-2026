import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Mail,
  Printer,
  ArrowRight,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { lineKey } from "@/hooks/useCart";

interface SavedOrder {
  orderNumber: string;
  placedAt: string;
  items: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string;
    image: string | null;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    withExchange?: boolean;
  }>;
  address: {
    fullName: string;
    phone: string;
    email: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    notes: string;
  };
  delivery: { id: string; label: string; eta: string; price: number };
  schedule?: {
    date: string;
    dateLabel: string;
    slot: string;
    slotLabel: string;
    slotWindow: string;
  };
  payment: { id: string; label: string; hint: string };
  totals: {
    subtotal: number;
    discount?: number;
    promo?: { code: string; label: string } | null;
    tax: number;
    shipping: number;
    total: number;
  };
}

const OrderConfirmation = () => {
  const [order, setOrder] = useState<SavedOrder | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("kachi_last_order");
      setOrder(raw ? (JSON.parse(raw) as SavedOrder) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  if (order === undefined) {
    return <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (order === null) {
    return <Navigate to="/" replace />;
  }

  const placedDate = new Date(order.placedAt);

  return (
    <div className="container-x py-10">
      {/* Success header */}
      <div className="bg-white border border-line p-6 md:p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 grid place-items-center mx-auto">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>
        <h1 className="font-display-tight text-3xl md:text-4xl font-bold mt-4">
          Order placed successfully!
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Thanks {order.address.fullName.split(" ")[0]}, we've received your order. A confirmation
          has been sent to <span className="font-semibold text-ink">{order.address.email}</span>.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-muted">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Order #</span>
          <span className="font-display font-bold text-lg">{order.orderNumber}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/shop">
              Continue shopping <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print receipt
          </Button>
        </div>
      </div>

      {/* Tracker */}
      <div className="mt-8 bg-white border border-line p-5 md:p-7">
        <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-5">
          What happens next
        </h2>
        <ol className="grid md:grid-cols-3 gap-4">
          <Step
            icon={Package}
            title="Order confirmed"
            desc={`Placed on ${placedDate.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}`}
            state="done"
          />
          <Step
            icon={ShieldCheck}
            title="Preparing for dispatch"
            desc="Quality-checked and packed within 24 hours."
            state="active"
          />
          <Step
            icon={Truck}
            title={order.delivery.label}
            desc={
              order.schedule
                ? `Scheduled for ${order.schedule.dateLabel} · ${order.schedule.slotLabel} (${order.schedule.slotWindow})`
                : `ETA: ${order.delivery.eta}`
            }
            state="upcoming"
          />
        </ol>
      </div>

      {order.schedule && (
        <div className="mt-6 bg-primary/5 border border-primary/30 p-4 flex items-start gap-3">
          <CalendarClock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-display font-bold uppercase tracking-wide">
              Delivery scheduled
            </div>
            <div className="text-muted-foreground">
              We'll deliver on{" "}
              <span className="font-semibold text-ink">{order.schedule.dateLabel}</span>{" "}
              between{" "}
              <span className="font-semibold text-ink">{order.schedule.slotWindow}</span>{" "}
              ({order.schedule.slotLabel}).
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
        {/* Items + addresses */}
        <section className="space-y-6">
          <div className="bg-white border border-line p-5 md:p-7">
            <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-4">
              Items ({order.items.length})
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((it) => (
                <li key={lineKey({ id: it.id, withExchange: it.withExchange })} className="py-4 flex gap-4 items-center">
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="h-16 w-16 object-cover bg-muted shrink-0" />
                  ) : (
                    <div className="h-16 w-16 bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${it.slug}`}
                      className="font-display font-semibold hover:text-primary line-clamp-2"
                    >
                      {it.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      SKU: {it.sku} · Qty {it.qty}
                      {it.withExchange ? " · with exchange" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatINR(it.lineTotal)}</div>
                    <div className="text-xs text-muted-foreground">{formatINR(it.unitPrice)} each</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoBlock title="Shipping address" icon={MapPin}>
              <div className="text-sm">
                <div className="font-semibold">{order.address.fullName}</div>
                <div>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ""}
                </div>
                <div>
                  {order.address.city}, {order.address.state} – {order.address.pincode}
                </div>
                <div className="mt-1 text-muted-foreground">{order.address.phone}</div>
                {order.address.gstin && (
                  <div className="mt-1 text-xs">
                    <span className="text-muted-foreground">GSTIN:</span>{" "}
                    <span className="font-mono font-semibold tracking-wider">
                      {order.address.gstin}
                    </span>
                  </div>
                )}
              </div>
            </InfoBlock>
            <InfoBlock title="Contact" icon={Mail}>
              <div className="text-sm">
                <div>{order.address.email}</div>
                <div className="mt-1 text-muted-foreground">
                  Updates and tracking info will be sent here.
                </div>
              </div>
            </InfoBlock>
          </div>
        </section>

        {/* Totals */}
        <aside className="bg-white border border-line p-6 h-fit">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">Payment summary</h2>
          <div className="mt-3 text-sm">
            <div className="font-semibold">{order.payment.label}</div>
            <div className="text-xs text-muted-foreground">{order.payment.hint}</div>
          </div>
          <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatINR(order.totals.subtotal)}</span>
            </div>
            {order.totals.discount && order.totals.discount > 0 ? (
              <div className="flex justify-between">
                <span className="text-success">
                  Discount{order.totals.promo ? ` (${order.totals.promo.code})` : ""}
                </span>
                <span className="font-semibold text-success">
                  −{formatINR(order.totals.discount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-semibold">{formatINR(order.totals.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className={order.totals.shipping === 0 ? "text-success font-semibold" : "font-semibold"}>
                {order.totals.shipping === 0 ? "FREE" : formatINR(order.totals.shipping)}
              </span>
            </div>
          </div>
          <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
            <span>Total paid</span>
            <span>{formatINR(order.totals.total)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4">
            Need help? Reach us at{" "}
            <Link to="/contact" className="text-primary hover:underline">
              support
            </Link>{" "}
            with your order number.
          </p>
        </aside>
      </div>
    </div>
  );
};

const Step = ({
  icon: Icon,
  title,
  desc,
  state,
}: {
  icon: typeof Package;
  title: string;
  desc: string;
  state: "done" | "active" | "upcoming";
}) => {
  const styles = {
    done: "bg-success/10 text-success border-success/30",
    active: "bg-primary/10 text-primary border-primary/30",
    upcoming: "bg-muted text-ink-soft border-line",
  }[state];
  return (
    <li className={`border p-4 flex gap-3 items-start ${styles}`}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="font-display font-semibold text-ink">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </li>
  );
};

const InfoBlock = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) => (
  <div className="bg-white border border-line p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-display font-bold uppercase tracking-wide text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

export default OrderConfirmation;
