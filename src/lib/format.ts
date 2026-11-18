const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹7,627.12 — for bill-style breakdowns (checkout, confirmation, admin). */
export function formatINRExact(amount: number): string {
  return inrExact.format(amount);
}

/** Store prices exclude GST; checkout adds it (default 18%). */
export const DEFAULT_GST_RATE = 18;
export const withGst = (price: number, ratePct = DEFAULT_GST_RATE) => Math.round(price * (1 + ratePct / 100));

export function discountPct(price: number, mrp: number | null): number | null {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}
