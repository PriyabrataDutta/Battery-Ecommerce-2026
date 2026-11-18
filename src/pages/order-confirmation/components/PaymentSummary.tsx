import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
import { formatINR, formatINRExact } from "@/lib/format";
import type { SavedOrder } from "../lib/types";

/**
 * PaymentSummary
 * --------------------------------------------------------------
 * Right-rail card with payment method, optional promo recap, the
 * line-by-line totals, and a final "Amount payable" row.
 *
 * Promo callout is only rendered when both `promo` and a positive
 * `discount` are present.
 */
export function PaymentSummary({
  payment,
  totals,
}: {
  payment: SavedOrder["payment"];
  totals: SavedOrder["totals"];
}) {
  const hasDiscount = !!totals.discount && totals.discount > 0;

  return (
    <aside className="bg-white border border-line p-6 h-fit">
      <h2 className="font-display font-bold text-lg uppercase tracking-wide">Payment summary</h2>
      <div className="mt-3 text-sm">
        <div className="font-semibold">{payment.label}</div>
        <div className="text-xs text-muted-foreground">{payment.hint}</div>
      </div>

      {totals.promo && hasDiscount ? (
        <PromoCallout promo={totals.promo} discount={totals.discount!} subtotal={totals.subtotal} />
      ) : null}

      <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
        <Row label="Subtotal (excl. GST)" value={formatINRExact(totals.subtotal)} />
        {hasDiscount && (
          <>
            <Row
              label={`Discount${totals.promo ? ` (${totals.promo.code})` : ""}`}
              value={`−${formatINRExact(totals.discount!)}`}
              tone="success"
            />
            <Row
              label="Taxable amount"
              value={formatINRExact(totals.subtotal - totals.discount!)}
            />
          </>
        )}
        <Row label="GST (18%)" value={formatINRExact(totals.tax)} />
        <Row
          label="Shipping"
          value={totals.shipping === 0 ? "FREE" : formatINRExact(totals.shipping)}
          tone={totals.shipping === 0 ? "success" : undefined}
        />
      </div>

      <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
        <span>Amount payable</span>
        <span>{formatINRExact(totals.total)}</span>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        Need help? Reach us at{" "}
        <Link to="/contact" className="text-primary hover:underline">
          support
        </Link>{" "}
        with your order number.
      </p>
    </aside>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  const labelClass = tone === "success" ? "text-success" : "text-muted-foreground";
  const valueClass = tone === "success" ? "font-semibold text-success" : "font-semibold";
  return (
    <div className="flex justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function PromoCallout({
  promo,
  discount,
  subtotal,
}: {
  promo: NonNullable<SavedOrder["totals"]["promo"]>;
  discount: number;
  subtotal: number;
}) {
  return (
    <div className="mt-4 border border-success/30 bg-success/5 p-3">
      <div className="flex items-start gap-2">
        <Tag className="h-4 w-4 text-success shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold tracking-wider text-success text-sm">
              {promo.code}
            </span>
            <span className="text-[10px] font-display font-bold uppercase tracking-wide bg-success/15 text-success px-1.5 py-0.5">
              Applied
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{promo.label}</div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground">You saved</span>
            <span className="text-right font-semibold text-success">−{formatINR(discount)}</span>
            <span className="text-muted-foreground">Subtotal after discount</span>
            <span className="text-right font-semibold text-ink">
              {formatINR(subtotal - discount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
