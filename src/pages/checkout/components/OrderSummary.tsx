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
import { PriceBreakup } from "@/components/PriceBreakup";
import type { GstGroup } from "@/lib/gst";
import { PromoInput } from "./PromoInput";
import type { DeliveryOption, Promo } from "../lib/types";

export const OrderSummary = ({
  items,
  totals,
  deliveryOption,
  appliedPromo,
  gst,
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
  /** GST per slab, from the server quote. */
  gst: GstGroup[] | undefined;
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
    <aside className="surface p-5 sm:p-6 lg:sticky lg:top-32">
      <h2 className="font-display-tight font-bold text-xl text-ink">Order summary</h2>

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
                    className="h-14 w-14 object-contain bg-muted rounded-xl p-1 shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 bg-muted rounded-xl shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-display font-bold text-ink line-clamp-2">{it.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Qty {it.qty}
                  </div>
                </div>
                <div className="text-sm font-bold text-ink whitespace-nowrap tabular-nums">
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
                    <span className="text-[11px] font-semibold">
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

      <PriceBreakup
        className="mt-4 rounded-2xl bg-muted/60 p-4"
        subtotal={subtotal}
        discount={discount}
        discountLabel={`Discount${appliedPromo ? ` (${appliedPromo.code})` : ""}`}
        gst={gst}
        delivery={shipping}
        total={total}
      />
      {quoteError && (
        <div className="mt-2 text-xs text-destructive font-medium">{quoteError}</div>
      )}
      {discount > 0 && (
        <div className="mt-1 text-xs text-success font-medium text-right">
          You saved {formatINR(discount)} on this order
        </div>
      )}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-success/10 px-3 py-2 text-xs font-medium text-success">
        <Lock className="h-3.5 w-3.5" />
        <span>Secure checkout · Your details are encrypted</span>
      </div>
    </aside>
  );
};
