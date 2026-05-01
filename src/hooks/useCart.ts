import { useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/catalog";

const KEY = "kachi_cart";

type Listener = () => void;
const listeners = new Set<Listener>();

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

/** Effective per-unit price based on exchange selection */
export function lineUnitPrice(it: CartItem) {
  if (it.withExchange && it.priceWithExchange) {
    return it.priceWithExchange;
  }
  if (it.priceWithoutExchange) {
    return it.priceWithoutExchange;
  }
  // fallback for old cart items
  return it.withExchange && it.exchangeRebate ? Math.max(0, it.price - it.exchangeRebate) : it.price;
}

/** Whether this item supports exchange pricing */
export function hasExchangeOption(it: CartItem) {
  return (
    it.priceWithExchange > 0 &&
    it.priceWithoutExchange > 0 &&
    it.priceWithExchange < it.priceWithoutExchange
  );
}

/** Unique key per product (exchange is now a mutable flag, not part of the key) */
function lineKey(it: Pick<CartItem, "id">) {
  return it.id;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(read);

  useEffect(() => {
    const sync = () => setItems(read());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const current = read();
    const key = lineKey(item);
    const existing = current.find((i) => lineKey(i) === key);
    if (existing) {
      existing.qty += qty;
      // Update exchange preference to the latest selection
      existing.withExchange = item.withExchange;
      write([...current]);
    } else {
      write([...current, { ...item, qty }]);
    }
  }, []);

  const removeLine = useCallback((key: string) => {
    write(read().filter((i) => lineKey(i) !== key));
  }, []);

  const setLineQty = useCallback((key: string, qty: number) => {
    if (qty <= 0) return removeLine(key);
    const current = read();
    const it = current.find((i) => lineKey(i) === key);
    if (it) {
      it.qty = qty;
      write([...current]);
    }
  }, [removeLine]);

  /** Toggle exchange preference for a cart line */
  const setExchange = useCallback((key: string, withExchange: boolean) => {
    const current = read();
    const it = current.find((i) => lineKey(i) === key);
    if (it) {
      it.withExchange = withExchange;
      write([...current]);
    }
  }, []);

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((s, i) => s + lineUnitPrice(i) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return {
    items,
    addItem,
    removeItem: removeLine,
    setQty: setLineQty,
    setExchange,
    clear,
    subtotal,
    count,
    lineKey,
  };
}

export { lineKey };
