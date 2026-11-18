import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CartItem } from "@/types/catalog";
import { groupGst, useGstRateOf } from "@/lib/gst";
import { getCartProducts } from "@/api/products";

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

/** Server limit per line (place_order allows 1–20), further capped by stock. */
export const MAX_LINE_QTY = 20;
export const maxQty = (it: Pick<CartItem, "stock">) =>
  Math.max(1, Math.min(MAX_LINE_QTY, it.stock ?? MAX_LINE_QTY));

/** Whether this item supports exchange pricing */
export function hasExchangeOption(it: CartItem) {
  return (
    it.hasExchange !== false &&
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
  const { rateOf, ready: gstReady } = useGstRateOf();

  useEffect(() => {
    const sync = () => setItems(read());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  /** `buyNow` puts the item in the cart without bumping an existing line. */
  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1, opts?: { buyNow?: boolean }) => {
    const current = read();
    const key = lineKey(item);
    const existing = current.find((i) => lineKey(i) === key);
    if (existing) {
      Object.assign(existing, { stock: item.stock, hasExchange: item.hasExchange });
      existing.qty = Math.min(maxQty(existing), opts?.buyNow ? existing.qty : existing.qty + qty);
      // Update exchange preference to the latest selection
      existing.withExchange = item.withExchange;
      write([...current]);
    } else {
      write([...current, { ...item, qty: Math.min(maxQty(item), qty) }]);
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
      it.qty = Math.min(maxQty(it), qty);
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
  // GST per line at the product's rate from Settings → GST, rounded to paise like the server.
  const gst = gstReady
    ? groupGst(items.map((i) => ({ amount: lineUnitPrice(i) * i.qty, rate: rateOf(i.gst_rate_id) ?? 0 })))
    : undefined;
  const gstTotal = gst?.reduce((s, g) => s + g.amount, 0);
  const total = gstTotal === undefined ? undefined : Math.round((subtotal + gstTotal) * 100) / 100;
  const count = items.reduce((s, i) => s + i.qty, 0);

  return {
    items,
    addItem,
    removeItem: removeLine,
    setQty: setLineQty,
    setExchange,
    clear,
    subtotal,
    gst,
    gstTotal,
    total,
    rateOf,
    count,
    lineKey,
  };
}

export { lineKey };

/**
 * Refresh cart lines from the database: drop products that were removed or
 * hidden, take current prices/stock/exchange flag, and cap quantities.
 * Mount on pages that show cart totals (cart, drawer, checkout).
 */
export function useCartSync() {
  const { items } = useCart();
  const ids = items.map((i) => i.id).sort();
  const { data } = useQuery({
    queryKey: ["cart-products", ids],
    queryFn: () => getCartProducts(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    const live = new Map(data.map((p) => [p.id, p]));
    const current = read();
    const removed: string[] = [];
    let changed = false;
    const next = current.flatMap((it) => {
      const p = live.get(it.id);
      if (!p || p.stock <= 0) {
        removed.push(it.name);
        changed = true;
        return [];
      }
      const upd: CartItem = {
        ...it,
        name: p.name,
        price: Number(p.price),
        priceWithExchange: Number(p.price_with_exchange),
        priceWithoutExchange: Number(p.price_without_exchange) || Number(p.price),
        hasExchange: p.has_exchange,
        stock: p.stock,
        gst_rate_id: p.gst_rate_id,
      };
      if (!hasExchangeOption(upd)) upd.withExchange = false;
      upd.qty = Math.min(maxQty(upd), it.qty);
      if (JSON.stringify(upd) !== JSON.stringify(it)) changed = true;
      return [upd];
    });
    if (!changed) return;
    write(next);
    if (removed.length) {
      toast.warning(`Removed from your cart: ${removed.join(", ")}`, {
        description: "No longer available or out of stock.",
      });
    }
  }, [data]);
}

