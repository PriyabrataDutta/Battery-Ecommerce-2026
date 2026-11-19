import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { CartItem } from "@/types/catalog";

const h = vi.hoisted(() => ({
  auth: { user: null as null | { id: string }, loading: false },
  live: [] as Array<Record<string, unknown>>,
  getCartProducts: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => h.auth }));
vi.mock("@/lib/gst", () => ({ useGstRateOf: () => ({ rateOf: () => 18, ready: true }), groupGst: () => [] }));
vi.mock("@/api/products", () => ({ getCartProducts: (ids: string[]) => h.getCartProducts(ids) }));

import { useAddToCart } from "@/hooks/useAddToCart";
import { PendingCartAction } from "@/components/cart/PendingCartAction";
import { localCartStore } from "@/api/cart";
import { savePendingAdd, takePendingAdd, clearPendingAdd, PENDING_TTL_MS } from "@/lib/pendingCart";
import { safeNext } from "@/lib/safeNext";

const item = (id: string, o: Partial<CartItem> = {}): Omit<CartItem, "qty"> => ({
  id, name: `Battery ${id}`, slug: id, sku: id, price: 5000, priceWithExchange: 4000,
  priceWithoutExchange: 5000, image: null, withExchange: true, hasExchange: true, stock: 10, ...o,
});
const liveRow = (id: string) => ({
  id, name: `Battery ${id}`, price: 5000, price_with_exchange: 4000, price_without_exchange: 5000,
  has_exchange: true, stock: 10, gst_rate_id: null,
});

function Where() {
  const l = useLocation();
  return <div data-testid="at">{l.pathname + l.search}</div>;
}
function AddButton({ buyNow = false }) {
  const add = useAddToCart();
  return <button onClick={() => add(item("A"), 2, { buyNow })}>add</button>;
}
const renderAt = (path: string, ui: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      {ui}
      <Routes>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

// In-memory localStorage (the test environment doesn't provide a usable one).
const mem = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
});

beforeEach(() => {
  localStorage.clear();
  h.auth = { user: null, loading: false };
  h.getCartProducts.mockReset();
  h.getCartProducts.mockImplementation(async (ids: string[]) => ids.map(liveRow));
});

describe("Add to Cart requires sign-in", () => {
  it("1. guest click → sign-in page, selection kept, cart untouched", () => {
    renderAt("/product/a?ref=x", <AddButton />);
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("at").textContent).toBe("/auth?next=%2Fproduct%2Fa%3Fref%3Dx&reason=cart");
    expect(localCartStore.get()).toEqual([]);
    const p = takePendingAdd()!;
    expect(p).toMatchObject({ qty: 2, buyNow: false, returnTo: "/product/a?ref=x" });
    expect(p.item.withExchange).toBe(true);
  });

  it("buy now as guest returns to checkout after sign-in", () => {
    renderAt("/shop", <AddButton buyNow />);
    fireEvent.click(screen.getByText("add"));
    expect(screen.getByTestId("at").textContent).toBe("/auth?next=%2Fcheckout&reason=cart");
  });

  it("signed-in click adds directly", () => {
    h.auth = { user: { id: "u1" }, loading: false };
    renderAt("/shop", <AddButton />);
    fireEvent.click(screen.getByText("add"));
    expect(localCartStore.get()).toMatchObject([{ id: "A", qty: 2 }]);
    expect(takePendingAdd()).toBeNull();
  });
});

describe("pending add after sign-in", () => {
  it("2 + 4. adds exactly once (two tabs), keeps and merges existing items", async () => {
    localCartStore.replace([{ ...item("A"), qty: 2 }, { ...item("B"), qty: 1 }]);
    savePendingAdd({ item: item("A"), qty: 1, buyNow: false, returnTo: "/shop" });
    h.auth = { user: { id: "u1" }, loading: false };
    renderAt("/shop", <><PendingCartAction /><PendingCartAction /></>);
    await waitFor(() => expect(localCartStore.get().find((i) => i.id === "A")?.qty).toBe(3));
    expect(localCartStore.get().find((i) => i.id === "B")?.qty).toBe(1);
    expect(localCartStore.get()).toHaveLength(2);
    expect(h.getCartProducts).toHaveBeenCalledTimes(1);
  });

  it("3. new item (e.g. after sign-up confirmation) is added with live price, then not again", async () => {
    savePendingAdd({ item: item("C", { price: 1 }), qty: 1, buyNow: false, returnTo: "/shop" });
    h.auth = { user: { id: "u2" }, loading: false };
    const { unmount } = renderAt("/shop", <PendingCartAction />);
    await waitFor(() => expect(localCartStore.get()).toHaveLength(1));
    expect(localCartStore.get()[0].price).toBe(5000);
    unmount();
    renderAt("/shop", <PendingCartAction />);
    await new Promise((r) => setTimeout(r, 10));
    expect(localCartStore.get()[0].qty).toBe(1);
  });

  it("skips products that are gone or out of stock", async () => {
    h.getCartProducts.mockResolvedValue([]);
    savePendingAdd({ item: item("D"), qty: 1, buyNow: false, returnTo: "/shop" });
    h.auth = { user: { id: "u3" }, loading: false };
    renderAt("/shop", <PendingCartAction />);
    await waitFor(() => expect(h.getCartProducts).toHaveBeenCalled());
    expect(localCartStore.get()).toEqual([]);
  });

  it("5. nothing happens without sign-in; expired or cleared pending adds are dropped", () => {
    savePendingAdd({ item: item("E"), qty: 1, buyNow: false, returnTo: "/shop" });
    renderAt("/shop", <PendingCartAction />);
    expect(localCartStore.get()).toEqual([]);
    expect(takePendingAdd(Date.now() + PENDING_TTL_MS + 1)).toBeNull();
    savePendingAdd({ item: item("E"), qty: 1, buyNow: false, returnTo: "/shop" });
    clearPendingAdd();
    expect(takePendingAdd()).toBeNull();
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/product/a?x=1")).toBe("/product/a?x=1");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext(null, "/admin")).toBe("/admin");
  });
});
