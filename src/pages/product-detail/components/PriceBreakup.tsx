/**
 * PriceBreakup — sticky right column showing the line-item totals.
 *
 * Pure presentation. All numbers are derived in the parent page so the same
 * subtotal that's shown here is the one written to the cart.
 */
import { formatINR } from "@/lib/format";
import { Row } from "./Row";

type Props = {
  qty: number;
  unitPrice: number;
  mrp: number | null;
  exchangeRebate: number;
  withExchange: boolean;
  showExchange: boolean;
};

export const PriceBreakup = ({
  qty,
  unitPrice,
  mrp,
  exchangeRebate,
  withExchange,
  showExchange,
}: Props) => {
  const baseTotal = (mrp ?? unitPrice) * qty;
  const discountAmt = Math.max(0, baseTotal - unitPrice * qty);
  const effectiveUnit = withExchange ? unitPrice - exchangeRebate : unitPrice;
  const lineTotal = effectiveUnit * qty;
  const totalSaving = discountAmt + (withExchange ? exchangeRebate * qty : 0);

  return (
    <div className="bg-muted/40 border border-line p-5 sticky top-28">
      <div className="space-y-2.5 text-sm">
        <Row label="Base Price" sub="(Inclusive of GST)" value={formatINR(baseTotal)} />
        {discountAmt > 0 && (
          <Row label="Special Discount" value={`– ${formatINR(discountAmt)}`} accent />
        )}
        <div className="border-t border-line pt-2.5">
          <Row label="Total Price" sub="(Inclusive of GST)" value={formatINR(unitPrice * qty)} bold />
        </div>
        <Row label="Shipping Charge" value={<span className="text-success">FREE</span>} />
        {withExchange && (
          <Row
            label="Old Battery Rebate"
            value={`– ${formatINR(exchangeRebate * qty)}`}
            accent
          />
        )}
        <div className="border-t-2 border-ink pt-2.5">
          <Row label="Total Amount to be Paid" value={formatINR(lineTotal)} bold accent />
        </div>
        {!withExchange && showExchange && (
          <div className="text-[11px] text-muted-foreground bg-white border border-dashed border-line p-2 mt-2">
            + upto {formatINR(exchangeRebate)} rebate on return of similar old battery
          </div>
        )}
      </div>
      {totalSaving > 0 && (
        <div className="mt-4 bg-success/10 border border-success/30 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-success">
            Total Saving
          </span>
          <span className="font-display font-bold text-success">{formatINR(totalSaving)}</span>
        </div>
      )}
    </div>
  );
};
