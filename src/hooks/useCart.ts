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
    const existing = current.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += qty;
      write([...current]);
    } else {
      write([...current, { ...item, qty }]);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    const current = read();
    const it = current.find((i) => i.id === id);
    if (it) {
      it.qty = qty;
      write([...current]);
    }
  }, [removeItem]);

  const clear = useCallback(() => write([]), []);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, addItem, removeItem, setQty, clear, subtotal, count };
}
