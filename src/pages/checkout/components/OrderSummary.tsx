/**
 * OrderSummary — sticky right-hand sidebar in the Checkout layout.
 *
 * Shows the cart line items, the promo input, the totals breakdown, and a
 * "secure checkout" badge. Composes <PromoInput /> rather than inlining it.
 *
 * Totals come from the parent (already calculated via lib/totals.ts) so we
 * never duplicate the math.
 */
import { Lock } from "lucide-react";
import { lineKey, lineUnitPrice, useCart } from "@/hooks/useCart";
import { formatINR } from "@/lib/format";
import { PromoInput } from "./PromoInput";
import type { DeliveryOption, Promo } from "../lib/types";
import type { Totals } from "../lib/totals";
import { TAX_RATE } from "../lib/constants";

export const OrderSummary = ({
  items,
  totals,
  deliveryOption,
  appliedPromo,
  promoInput,
  setPromoInput,
  promoError,
  clearPromoError,
  onApplyPromo,
  onRemovePromo,
}: {
  items: ReturnType<typeof useCart>["items"];
  totals: Totals;
  deliveryOption: DeliveryOption;
  appliedPromo: Promo | null;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  clearPromoError: () => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
}) => {
  const { subtotal, discount, tax, total } = totals;

  return (
    <aside className="bg-white border border-line p-6 h-fit lg:sticky lg:top-32">
      <h2 className="font-display font-bold text-lg uppercase tracking-wide">Order Summary</h2>

      <ul className="mt-4 divide-y divide-line">
        {items.map((it) => {
          const k = lineKey(it);
          const unit = lineUnitPrice(it);
          return (
            <li key={k} className="py-3 flex gap-3">
              {it.image ? (
                <img
                  src={it.image}
                  alt={it.name}
                  className="h-14 w-14 object-cover bg-muted shrink-0"
                />
              ) : (
                <div className="h-14 w-14 bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-display font-semibold line-clamp-2">{it.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Qty {it.qty}
                  {it.withExchange ? " · with exchange" : ""}
                </div>
              </div>
              <div className="text-sm font-semibold whitespace-nowrap">
                {formatINR(unit * it.qty)}
              </div>
            </li>
          );
        })}
      </ul>

      <PromoInput
        appliedPromo={appliedPromo}
        promoInput={promoInput}
        setPromoInput={setPromoInput}
        promoError={promoError}
        clearError={clearPromoError}
        onApply={onApplyPromo}
        onRemove={onRemovePromo}
      />

      <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatINR(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-success">
              Discount{appliedPromo ? ` (${appliedPromo.code})` : ""}
            </span>
            <span className="font-semibold text-success">−{formatINR(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST (18%)</span>
          <span className="font-semibold">{formatINR(tax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className={deliveryOption.price === 0 ? "text-success font-semibold" : "font-semibold"}>
            {deliveryOption.price === 0 ? "FREE" : formatINR(deliveryOption.price)}
          </span>
        </div>
      </div>
      <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
        <span>Total</span>
        <span>{formatINR(total)}</span>
      </div>
      {discount > 0 && (
        <div className="mt-1 text-xs text-success font-medium text-right">
          You saved{" "}
          {formatINR(discount + Math.round(subtotal * TAX_RATE - tax))} on this order
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secure checkout · Your details are encrypted</span>
      </div>
    </aside>
  );
};
