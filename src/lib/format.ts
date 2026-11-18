const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹9,000 for whole rupees, ₹7,627.12 when there are paise (prices are pre-GST, so often fractional). */
export function formatINR(amount: number): string {
  const paise = Math.round(amount * 100);
  return paise % 100 === 0 ? inrFormatter.format(paise / 100) : inrExact.format(paise / 100);
}


/** ₹7,627.12 — for bill-style breakdowns (checkout, confirmation, admin). */
export function formatINRExact(amount: number): string {
  return inrExact.format(amount);
}

/** Store prices exclude GST; GST (default 18%) is added in the cart and at checkout. */
export const DEFAULT_GST_RATE = 18;
const toPaise = (n: number) => Math.round(n * 100) / 100;
/** GST on a pre-GST amount, rounded to paise — same as the server (_price_order). */
export const gstOn = (amount: number, ratePct = DEFAULT_GST_RATE) => toPaise((amount * ratePct) / 100);
/** Pre-GST amount + GST, exact to the paisa (no rounding to the rupee). */
export const withGst = (amount: number, ratePct = DEFAULT_GST_RATE) => toPaise(amount + gstOn(amount, ratePct));

export function discountPct(price: number, mrp: number | null): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}
