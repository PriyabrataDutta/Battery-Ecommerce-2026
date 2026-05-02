/**
 * Checkout — totals math.
 *
 * Pure functions only. Given a subtotal + state, return the discount, tax,
 * shipping and grand total. Keeping this here means the same numbers can be
 * reused from the order-confirmation page or a future "preview" component
 * without re-deriving them.
 */
import { TAX_RATE } from "./constants";
import type { DeliveryOption, Promo } from "./types";

export const calcDiscount = (subtotal: number, promo: Promo | null) => {
  if (!promo) return 0;
  if (promo.minSubtotal && subtotal < promo.minSubtotal) return 0;
  const raw =
    promo.type === "percent"
      ? Math.round((subtotal * promo.value) / 100)
      : promo.value;
  // Never let the discount exceed the subtotal.
  return Math.min(raw, subtotal);
};

/**
 * Calculate tax. Accepts an optional custom rate (decimal, e.g. 0.18).
 * Falls back to the hardcoded TAX_RATE constant for backward compat.
 */
export const calcTax = (discountedSubtotal: number, rate?: number) =>
  Math.round(discountedSubtotal * (rate ?? TAX_RATE));

export type Totals = {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  tax: number;
  shipping: number;
  total: number;
  /** Effective weighted GST % used (for display) */
  effectiveGstPct: number;
};

export interface LineGst {
  lineTotal: number;
  /** Decimal rate, e.g. 0.18 */
  rate: number;
}

/**
 * Calculate totals with per-line-item GST rates.
 *
 * @param subtotal      - raw sum of line totals before discount
 * @param promo         - applied promo, if any
 * @param deliveryOption
 * @param lineGstItems  - per-line-item amounts and their GST rates.
 *                        If undefined, falls back to a single flat rate.
 * @param fallbackRate  - flat rate fallback (decimal)
 */
export const calcTotals = (
  subtotal: number,
  promo: Promo | null,
  deliveryOption: DeliveryOption,
  lineGstItems?: LineGst[],
  fallbackRate?: number,
): Totals => {
  const discount = calcDiscount(subtotal, promo);
  const discountedSubtotal = Math.max(0, subtotal - discount);

  let tax: number;
  let effectiveGstPct: number;

  if (lineGstItems && lineGstItems.length > 0 && subtotal > 0) {
    // Proportional discount: each line's share of the discount is proportional
    // to its share of the subtotal.
    const discountRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1;
    tax = Math.round(
      lineGstItems.reduce(
        (sum, li) => sum + li.lineTotal * discountRatio * li.rate,
        0,
      ),
    );
    effectiveGstPct =
      discountedSubtotal > 0
        ? Math.round((tax / discountedSubtotal) * 10000) / 100
        : 0;
  } else {
    const rate = fallbackRate ?? TAX_RATE;
    tax = calcTax(discountedSubtotal, rate);
    effectiveGstPct = Math.round(rate * 10000) / 100;
  }

  const shipping = deliveryOption.price;
  const total = discountedSubtotal + tax + shipping;
  return { subtotal, discount, discountedSubtotal, tax, shipping, total, effectiveGstPct };
};
