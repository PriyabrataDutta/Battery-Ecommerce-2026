/**
 * GST comes from Admin → Settings → GST (gst_rates). Each product has a
 * gst_rate_id; products without one use the rate marked default there.
 * Prices are stored excl. GST; GST is added per line, rounded to paise —
 * the same rule as the server's _price_order.
 */
import { useCallback } from "react";
import { useGstRates } from "@/hooks/useGstSettings";

export type GstGroup = { rate: number; amount: number };

const toPaise = (n: number) => Math.round(n * 100) / 100;

/** GST on a pre-GST amount at `ratePct`, rounded to paise. */
export const gstOn = (amount: number, ratePct: number) => toPaise((amount * ratePct) / 100);

/** Pre-GST amount + GST, exact to the paisa. */
export const withGst = (amount: number, ratePct: number) => toPaise(amount + gstOn(amount, ratePct));

/** Sum GST per rate, e.g. [{rate: 18, amount: 488.13}] — one breakup row per slab. */
export function groupGst(lines: { amount: number; rate: number }[]): GstGroup[] {
  const by = new Map<number, number>();
  for (const l of lines) by.set(l.rate, toPaise((by.get(l.rate) ?? 0) + gstOn(l.amount, l.rate)));
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([rate, amount]) => ({ rate, amount }));
}

/** Group lines whose GST was already computed (server quote / saved order items). */
export function groupTaxed(lines: { rate: number; tax: number }[]): GstGroup[] {
  const by = new Map<number, number>();
  for (const l of lines) by.set(l.rate, toPaise((by.get(l.rate) ?? 0) + l.tax));
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([rate, amount]) => ({ rate, amount }));
}

/** rateOf(gst_rate_id) → % from the GST settings (default slab if unset). Undefined until rates load. */
export function useGstRateOf() {
  const { data: rates } = useGstRates();
  const rateOf = useCallback(
    (id?: string | null): number | undefined => {
      if (!rates) return undefined;
      const r = (id && rates.find((x) => x.id === id)) || rates.find((x) => x.is_default);
      return r ? Number(r.rate) : undefined;
    },
    [rates],
  );
  return { rateOf, ready: !!rates };
}
