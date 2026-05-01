/**
 * ProductDetail — generic label/value row used in the price-breakup card.
 *
 * `forwardRef` is kept so callers can animate it later if needed.
 */
import { forwardRef, type ReactNode } from "react";

export const Row = forwardRef<
  HTMLDivElement,
  {
    label: string;
    sub?: string;
    value: ReactNode;
    bold?: boolean;
    accent?: boolean;
  }
>(function Row({ label, sub, value, bold, accent }, ref) {
  return (
    <div ref={ref} className="flex items-start justify-between gap-2">
      <div className="text-muted-foreground">
        <div className={bold ? "text-ink font-semibold" : ""}>{label}</div>
        {sub && <div className="text-[10px]">{sub}</div>}
      </div>
      <div
        className={`text-right ${
          bold ? "font-display font-bold text-base" : "font-semibold"
        } ${accent ? "text-primary" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
});
