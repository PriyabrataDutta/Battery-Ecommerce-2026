import type { CartItem } from "@/types/catalog";

/**
 * An Add to Cart a guest clicked before signing in. Kept in localStorage (not
 * sessionStorage) so it survives the sign-up confirmation link opening in a new
 * tab; expires after 30 minutes. Prices in it are re-read from the database
 * before it is added, and place_order re-prices anyway.
 */
export interface PendingCartAdd {
  item: Omit<CartItem, "qty">;
  qty: number;
  buyNow: boolean;
  returnTo: string;
  createdAt: number;
}

const KEY = "kachi_pending_cart";
export const PENDING_TTL_MS = 30 * 60 * 1000;

export function savePendingAdd(p: Omit<PendingCartAdd, "createdAt">) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, createdAt: Date.now() }));
  } catch {
    /* storage blocked: the guest just adds it again after signing in */
  }
}

export function hasPendingAdd() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function clearPendingAdd() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Removes and returns the pending add (so it runs at most once); null if none or expired. */
export function takePendingAdd(now = Date.now()): PendingCartAdd | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as PendingCartAdd;
    if (!p?.item?.id || !(now - p.createdAt < PENDING_TTL_MS)) return null;
    return p;
  } catch {
    return null;
  }
}

/** Runs fn while holding a cross-tab lock where supported (two tabs both see the sign-in). */
export function withPendingLock(fn: () => Promise<void>): Promise<void> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request("kachi-pending-cart", fn) : fn();
}
