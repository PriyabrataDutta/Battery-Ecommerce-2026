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

import { orderAttemptKey, clearOrderAttempt } from "@/pages/checkout/lib/draft";

describe("order attempt key (idempotency)", () => {
  const attempt = { items: [{ product_id: "p1", qty: 2 }], delivery: "standard", payment: "cod" };
  it("reuses the key for a retry of the same attempt", () => {
    clearOrderAttempt();
    expect(orderAttemptKey(attempt)).toBe(orderAttemptKey({ ...attempt }));
  });
  it("starts a new key when anything changes or after success", () => {
    const k = orderAttemptKey(attempt);
    expect(orderAttemptKey({ ...attempt, delivery: "express" })).not.toBe(k);
    clearOrderAttempt();
    expect(orderAttemptKey(attempt)).not.toBe(k);
  });
});

import { normalizeIndianMobile } from "@/lib/phone";

describe("normalizeIndianMobile (mirrors public.normalize_in_phone)", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["91-98765-43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["\t+919832465858", "+919832465858"],
  ])("%s → %s", (input, out) => expect(normalizeIndianMobile(input)).toBe(out));
  it.each(["12345", "+91999999999912", "5876543210", "abc", ""])("rejects %s", (input) =>
    expect(normalizeIndianMobile(input)).toBeNull(),
  );
});

import { signUpSchema } from "@/components/auth/signUpSchema";

describe("sign-up form validation", () => {
  const ok = { fullName: "Priya Dutta", phone: "98765 43210", email: "Priya@Example.com ", password: "battery2026", confirmPassword: "battery2026" };
  const firstError = (v: object) => {
    const r = signUpSchema.safeParse({ ...ok, ...v });
    return r.success ? null : r.error.issues[0].message;
  };
  it("accepts a valid form and normalises phone + email", () => {
    const r = signUpSchema.safeParse(ok);
    expect(r.success && [r.data.phone, r.data.email]).toEqual(["+919876543210", "priya@example.com"]);
  });
  it.each([
    [{ fullName: "A" }, "Enter your full name"],
    [{ fullName: "R2D2" }, "Use letters only"],
    [{ phone: "12345" }, "Enter a valid 10-digit Indian mobile number"],
    [{ email: "nope" }, "Enter a valid email"],
    [{ password: "short1", confirmPassword: "short1" }, "At least 8 characters"],
    [{ password: "onlyletters", confirmPassword: "onlyletters" }, "Include at least one number"],
    [{ confirmPassword: "different1" }, "Passwords don't match"],
    [{ password: "priya12345", confirmPassword: "priya12345" }, "Password must not contain your email name"],
  ])("rejects %o", (v, msg) => expect(firstError(v)).toBe(msg));
});
