import { Package, ShieldCheck, Truck, CalendarClock } from "lucide-react";
import type { SavedOrder } from "../lib/types";

/**
 * OrderTracker
 * --------------------------------------------------------------
 * 3-step progress strip ("confirmed → preparing → delivery") plus
 * an optional banner when a slot has been scheduled.
 *
 * To add a 4th step (e.g. "Out for delivery"), extend the <ol>
 * grid columns and append another <Step />.
 */
export function OrderTracker({ order }: { order: SavedOrder }) {
  const placedDate = new Date(order.placedAt);

  return (
    <>
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
            <div className="font-display font-bold uppercase tracking-wide">Delivery scheduled</div>
            <div className="text-muted-foreground">
              We'll deliver on{" "}
              <span className="font-semibold text-ink">{order.schedule.dateLabel}</span> between{" "}
              <span className="font-semibold text-ink">{order.schedule.slotWindow}</span> (
              {order.schedule.slotLabel}).
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Step({
  icon: Icon,
  title,
  desc,
  state,
}: {
  icon: typeof Package;
  title: string;
  desc: string;
  state: "done" | "active" | "upcoming";
}) {
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
}
