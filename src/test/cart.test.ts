import { describe, it, expect } from "vitest";
import { maxQty, hasExchangeOption, lineUnitPrice } from "@/hooks/useCart";
import { addressSchema } from "@/pages/checkout/lib/validation";
import type { CartItem } from "@/types/catalog";

const item = (o: Partial<CartItem> = {}): CartItem => ({
  id: "p1", name: "Amaron 38B20L", slug: "a", sku: "A", price: 5000,
  priceWithExchange: 3200, priceWithoutExchange: 5000, qty: 1, image: null, ...o,
});

describe("cart rules", () => {
  it("caps quantity at 20 and at stock", () => {
    expect(maxQty(item())).toBe(20);
    expect(maxQty(item({ stock: 5 }))).toBe(5);
    expect(maxQty(item({ stock: 50 }))).toBe(20);
  });

  it("only offers exchange when the product allows it", () => {
    expect(hasExchangeOption(item())).toBe(true);
    expect(hasExchangeOption(item({ hasExchange: false }))).toBe(false);
    expect(hasExchangeOption(item({ priceWithExchange: 5000 }))).toBe(false);
  });

  it("prices exchange vs no exchange", () => {
    expect(lineUnitPrice(item({ withExchange: true }))).toBe(3200);
    expect(lineUnitPrice(item({ withExchange: false }))).toBe(5000);
  });
});

describe("checkout phone", () => {
  const base = {
    fullName: "Test Buyer", email: "t@example.com", line1: "12 MG Road", line2: "",
    landmark: "Near Park", city: "Kolkata", state: "West Bengal", pincode: "700001", gstin: "", notes: "",
  };
  it.each(["9876543210", "+91 98765 43210", "09876543210", "91-98765-43210"])("accepts %s", (phone) => {
    const r = addressSchema.safeParse({ ...base, phone });
    expect(r.success && r.data.phone).toBe("9876543210");
  });
  it("rejects short numbers", () => {
    expect(addressSchema.safeParse({ ...base, phone: "98765" }).success).toBe(false);
  });
});
