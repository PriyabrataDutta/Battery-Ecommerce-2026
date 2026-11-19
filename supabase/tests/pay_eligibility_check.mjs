// Who may start / check a Cashfree payment (cashfree-order uses payBlock).
// Run: node supabase/tests/pay_eligibility_check.mjs
import assert from "node:assert/strict";
import { payBlock } from "../functions/_shared/cashfree.ts";

const order = { user_id: "alice", status: "pending", payment_status: "unpaid", payment_method: "Online (Cashfree)" };

// Owner, eligible: allowed. No staff role involved anywhere.
assert.equal(payBlock(order, "alice", "create"), null, "owner can pay");
assert.equal(payBlock(order, "alice", "verify"), null, "owner can verify");
// Another customer's order looks like it doesn't exist (no probing).
assert.equal(payBlock(order, "bob", "create")?.status, 404, "other customer cannot pay");
assert.equal(payBlock(order, "bob", "verify")?.status, 404, "other customer cannot verify");
assert.equal(payBlock(null, "alice", "create")?.status, 404, "unknown order");
// Eligibility.
assert.equal(payBlock({ ...order, payment_status: "paid" }, "alice", "create")?.status, 409, "already paid");
assert.equal(payBlock({ ...order, status: "cancelled" }, "alice", "create")?.status, 409, "expired / cancelled");
assert.equal(payBlock({ ...order, payment_method: "Cash on Delivery" }, "alice", "create")?.status, 400, "COD order");
// A failed attempt leaves the order unpaid + pending, so retry stays allowed.
assert.equal(payBlock({ ...order, payment_status: "failed" }, "alice", "create"), null, "retry after failure");
console.log("pay_eligibility_check passed");
