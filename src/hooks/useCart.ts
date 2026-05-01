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

// Effective per-unit price (with exchange rebate applied if chosen)
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

// Distinct cart key — same product with/without exchange are separate lines
function lineKey(it: Pick<CartItem, "id" | "withExchange">) {
  return `${it.id}__${it.withExchange ? "ex" : "noex"}`;
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

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((s, i) => s + lineUnitPrice(i) * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return {
    items,
    addItem,
    removeItem: removeLine,
    setQty: setLineQty,
    clear,
    subtotal,
    count,
    lineKey,
  };
}

export { lineKey };
