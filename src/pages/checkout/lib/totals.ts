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
};

export const calcTotals = (
  subtotal: number,
  promo: Promo | null,
  deliveryOption: DeliveryOption,
  taxRate?: number,
): Totals => {
  const discount = calcDiscount(subtotal, promo);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = calcTax(discountedSubtotal, taxRate);
  const shipping = deliveryOption.price;
  const total = discountedSubtotal + tax + shipping;
  return { subtotal, discount, discountedSubtotal, tax, shipping, total };
};
