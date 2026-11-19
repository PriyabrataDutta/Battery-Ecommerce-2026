import type { CartItem } from "@/types/catalog";

/**
 * Cart storage contract. Pages and hooks only talk to a CartStore, so the
 * browser cart below can later be swapped for a server cart (carts table or
 * NestJS /v1/cart for mobile and B2B) without touching components.
 * Prices in the cart are display-only — place_order always re-prices.
 */
export interface CartStore {
  get(): CartItem[];
  /** Adds qty to an existing line (or sets it, for buy-now); capped at maxQty. */
  add(item: Omit<CartItem, "qty">, qty: number, opts?: { buyNow?: boolean }): void;
  setQty(id: string, qty: number): void;
  setExchange(id: string, withExchange: boolean): void;
  remove(id: string): void;
  replace(items: CartItem[]): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

/** Server limit per line (place_order allows 1–20), further capped by stock. */
export const MAX_LINE_QTY = 20;
export const maxQty = (it: Pick<CartItem, "stock">) =>
  Math.max(1, Math.min(MAX_LINE_QTY, it.stock ?? MAX_LINE_QTY));

const KEY = "kachi_cart";
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

/** The current cart: kept in this browser's localStorage (not tied to an account). */
export const localCartStore: CartStore = {
  get: read,
  add(item, qty, opts) {
    const current = read();
    const existing = current.find((i) => i.id === item.id);
    if (existing) {
      Object.assign(existing, { stock: item.stock, hasExchange: item.hasExchange });
      existing.qty = Math.min(maxQty(existing), opts?.buyNow ? existing.qty : existing.qty + qty);
      // Update exchange preference to the latest selection
      existing.withExchange = item.withExchange;
      write([...current]);
    } else {
      write([...current, { ...item, qty: Math.min(maxQty(item), qty) }]);
    }
  },
  setQty(id, qty) {
    if (qty <= 0) return localCartStore.remove(id);
    const current = read();
    const it = current.find((i) => i.id === id);
    if (it) {
      it.qty = Math.min(maxQty(it), qty);
      write([...current]);
    }
  },
  setExchange(id, withExchange) {
    const current = read();
    const it = current.find((i) => i.id === id);
    if (it) {
      it.withExchange = withExchange;
      write([...current]);
    }
  },
  remove(id) {
    write(read().filter((i) => i.id !== id));
  },
  replace: write,
  clear: () => write([]),
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
