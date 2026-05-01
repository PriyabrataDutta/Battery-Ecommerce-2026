/**
 * ReviewStep — Step 4 of checkout.
 *
 * Read-only summary the customer sees before clicking "Place order". All
 * data flows in via props; this component never reads global state.
 */
import { CalendarIcon, MapPin, ShieldCheck, Truck } from "lucide-react";
import { lineKey, lineUnitPrice, useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/format";
import { ReviewBlock } from "./ReviewBlock";
import type { Address, DeliveryOption, PaymentOption } from "../lib/types";

export const ReviewStep = ({
  items,
  address,
  delivery,
  payment,
  schedule,
}: {
  items: ReturnType<typeof useCart>["items"];
  address: Address;
  delivery: DeliveryOption;
  payment: PaymentOption;
  schedule: { dateLabel: string; slotLabel: string; slotWindow: string } | null;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display-tight text-xl font-bold">Review & confirm</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please double-check everything before placing your order.
        </p>
      </div>

      <ReviewBlock title="Shipping to" icon={MapPin}>
        <div className="text-sm">
          <div className="font-semibold">{address.fullName}</div>
          <div>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </div>
          {address.landmark && (
            <div className="text-muted-foreground">Landmark: {address.landmark}</div>
          )}
          <div>
            {address.city}, {address.state} – {address.pincode}
          </div>
          <div className="mt-1 text-muted-foreground">
            {address.phone} · {address.email}
          </div>
          {address.gstin && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">GSTIN:</span>{" "}
              <span className="font-mono font-semibold tracking-wider">{address.gstin}</span>
            </div>
          )}
          {address.notes && (
            <div className="mt-2 text-xs italic text-muted-foreground">"{address.notes}"</div>
          )}
        </div>
      </ReviewBlock>

      <ReviewBlock title="Delivery" icon={Truck}>
        <div className="text-sm flex items-center justify-between">
          <div>
            <div className="font-semibold">{delivery.label}</div>
            <div className="text-xs text-muted-foreground">{delivery.eta}</div>
          </div>
          <div className="font-bold">
            {delivery.price === 0 ? (
              <span className="text-success">FREE</span>
            ) : (
              formatINR(delivery.price)
            )}
          </div>
        </div>
        {schedule && (
          <div className="mt-3 pt-3 border-t border-line text-sm flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
            <span>
              <span className="font-semibold text-ink">{schedule.dateLabel}</span> ·{" "}
              {schedule.slotLabel} ({schedule.slotWindow})
            </span>
          </div>
        )}
      </ReviewBlock>

      <ReviewBlock title="Payment" icon={payment.icon}>
        <div className="text-sm">
          <div className="font-semibold">{payment.label}</div>
          <div className="text-xs text-muted-foreground">{payment.hint}</div>
        </div>
      </ReviewBlock>

      <ReviewBlock title={`Items (${items.length})`} icon={ShieldCheck}>
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const k = lineKey(it);
            const unit = lineUnitPrice(it);
            return (
              <li key={k} className="py-2 flex justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="font-display font-semibold line-clamp-1">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {it.qty} × {formatINR(unit)}
                    {it.withExchange ? " · with exchange" : ""}
                  </div>
                </div>
                <div className="font-semibold whitespace-nowrap">
                  {formatINR(unit * it.qty)}
                </div>
              </li>
            );
          })}
        </ul>
      </ReviewBlock>
    </div>
  );
};
