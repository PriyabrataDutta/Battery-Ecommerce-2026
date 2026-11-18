/**
 * Checkout — localStorage draft persistence.
 *
 * The customer should be able to refresh mid-flow without losing what they
 * typed, but a stale draft from "yesterday" would be more confusing than
 * helpful. So drafts live for 5 minutes (DRAFT_TTL_MS).
 */
import { DRAFT_KEY, DRAFT_TTL_MS } from "./constants";
import type { Address, DeliveryId, PaymentId, SlotId } from "./types";

export type CheckoutDraft = {
  savedAt: number;
  address: Address;
  delivery: DeliveryId;
  payment: PaymentId;
  promoInput: string;
  deliveryDate: string | null; // ISO
  slot: SlotId | "";
};

export const loadDraft = (): CheckoutDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutDraft;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(DRAFT_KEY);
    return null;
  }
};

export const saveDraft = (draft: Omit<CheckoutDraft, "savedAt">) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: Date.now() } satisfies CheckoutDraft),
    );
  } catch {
    // storage full / disabled — silently ignore
  }
};

export const clearDraft = () => {
  if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
};

/**
 * Idempotency key for "Place order". The same checkout attempt (same cart,
 * address, delivery, promo, payment) reuses its key — also across a page
 * reload — so a retry after a network error returns the order already
 * created instead of placing a second one. Any change starts a new attempt.
 */
const ATTEMPT_KEY = "kachi_checkout_attempt";

export function orderAttemptKey(attempt: unknown): string {
  const sig = JSON.stringify(attempt);
  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) || "null");
    if (saved?.sig === sig && typeof saved.key === "string") return saved.key;
  } catch {
    /* fall through to a new key */
  }
  const key = crypto.randomUUID();
  try {
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ sig, key }));
  } catch {
    /* private mode: key still protects in-page retries */
  }
  return key;
}

export function clearOrderAttempt() {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* ignore */
  }
}
