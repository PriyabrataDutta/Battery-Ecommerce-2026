/**
 * Price breakup shown wherever a total appears (cart, cart drawer, checkout,
 * confirmation): Subtotal (excl. GST) → Discount → GST per slab → Delivery → Total.
 */
import { formatINRExact } from "@/lib/format";
import type { GstGroup } from "@/lib/gst";

export function PriceBreakup({
  subtotal,
  discount = 0,
  discountLabel = "Discount",
  gst,
  delivery,
  total,
  totalLabel = "Total (incl. GST)",
  className = "",
}: {
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  gst: GstGroup[] | undefined;
  /** number = charge (0 shows FREE); string = note such as "Chosen at checkout"; omit to hide */
  delivery?: number | string;
  total: number | undefined;
  totalLabel?: string;
  className?: string;
}) {
  const row = (label: string, value: React.ReactNode, tone = "", key?: string) => (
    <div key={key} className="flex justify-between gap-3">
      <span className={tone || "text-muted-foreground"}>{label}</span>
      <span className={`font-semibold text-right ${tone}`}>{value}</span>
    </div>
  );
  return (
    <div className={className}>
      <div className="space-y-2 text-sm">
        {row("Subtotal (excl. GST)", formatINRExact(subtotal))}
        {discount > 0 && row(discountLabel, `−${formatINRExact(discount)}`, "text-success")}
        {discount > 0 && row("Taxable amount", formatINRExact(subtotal - discount))}
        {gst === undefined
          ? row("GST", "…")
          : gst.map((g) => row(Number.isFinite(g.rate) ? `GST @ ${g.rate}%` : "GST", formatINRExact(g.amount), "", `gst-${g.rate}`))}
        {typeof delivery === "number" &&
          row("Delivery", delivery === 0 ? "FREE" : formatINRExact(delivery), delivery === 0 ? "text-success" : "")}
        {typeof delivery === "string" && row("Delivery", <span className="font-normal text-muted-foreground">{delivery}</span>)}
      </div>
      <div className="border-t border-line mt-3 pt-3 flex justify-between font-display font-bold text-lg">
        <span>{totalLabel}</span>
        <span>{total === undefined ? "…" : formatINRExact(total)}</span>
      </div>
    </div>
  );
}
