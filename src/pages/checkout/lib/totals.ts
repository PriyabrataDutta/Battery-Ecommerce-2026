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

export const calcTax = (discountedSubtotal: number) =>
  Math.round(discountedSubtotal * TAX_RATE);

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
): Totals => {
  const discount = calcDiscount(subtotal, promo);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = calcTax(discountedSubtotal);
  const shipping = deliveryOption.price;
  const total = discountedSubtotal + tax + shipping;
  return { subtotal, discount, discountedSubtotal, tax, shipping, total };
};
