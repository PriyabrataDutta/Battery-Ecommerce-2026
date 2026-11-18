/**
 * OrderSummary — sticky right-hand sidebar in the Checkout layout.
 *
 * Shows the cart line items with exchange status, promo input, totals breakdown,
 * and a "secure checkout" badge.
 */
import { ArrowLeftRight, Lock } from "lucide-react";
import { lineKey, lineUnitPrice, hasExchangeOption, useCart } from "@/hooks/useCart";
import { Switch } from "@/components/ui/switch";
import { formatINR } from "@/lib/format";
import { PromoInput } from "./PromoInput";
import type { DeliveryOption, Promo } from "../lib/types";

export const OrderSummary = ({
  items,
  totals,
  deliveryOption,
  appliedPromo,
  quoteError,
  promoInput,
  setPromoInput,
  promoError,
  clearPromoError,
  onApplyPromo,
  onRemovePromo,
}: {
  items: ReturnType<typeof useCart>["items"];
  totals: { subtotal: number; discount: number; tax: number; shipping: number; total: number };
  deliveryOption: DeliveryOption;
  appliedPromo: Promo | null;
  quoteError: string | null;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  clearPromoError: () => void;
  onApplyPromo: () => void;
  onRemovePromo: () => void;
}) => {
  const { subtotal, discount, tax, shipping, total } = totals;
  const { setExchange } = useCart();

  return (
    <aside className="bg-white border border-line p-6 h-fit lg:sticky lg:top-32">
      <h2 className="font-display font-bold text-lg uppercase tracking-wide">Order Summary</h2>

      <ul className="mt-4 divide-y divide-line">
        {items.map((it) => {
          const k = lineKey(it);
          const unit = lineUnitPrice(it);
          const canExchange = hasExchangeOption(it);
          return (
            <li key={k} className="py-3">
              <div className="flex gap-3">
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
                  </div>
                </div>
                <div className="text-sm font-semibold whitespace-nowrap">
                  {formatINR(unit * it.qty)}
                </div>
              </div>

              {/* Exchange toggle in checkout */}
              {canExchange && (
                <label className="mt-1.5 flex items-center gap-2 cursor-pointer select-none pl-[62px]">
                  <Switch
                    checked={!!it.withExchange}
                    onCheckedChange={(v) => setExchange(k, v)}
                    className="data-[state=checked]:bg-primary scale-[0.8]"
                  />
                  <div className="flex items-center gap-1">
                    <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold">
                      {it.withExchange ? "With exchange" : "Without exchange"}
                    </span>
                  </div>
                </label>
              )}
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
          <span className="text-muted-foreground">Shipping</span>
          <span className={shipping === 0 ? "text-success font-semibold" : "font-semibold"}>
            {shipping === 0 ? "FREE" : formatINR(shipping)}
          </span>
        </div>
      </div>
      <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
        <span>Total</span>
        <span>{formatINR(total)}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground text-right">
        Includes GST of {formatINR(tax)}
      </div>
      {quoteError && (
        <div className="mt-2 text-xs text-destructive font-medium">{quoteError}</div>
      )}
      {discount > 0 && (
        <div className="mt-1 text-xs text-success font-medium text-right">
          You saved {formatINR(discount)} on this order
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secure checkout · Your details are encrypted</span>
      </div>
    </aside>
  );
};
