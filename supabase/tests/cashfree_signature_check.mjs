// Checks verifyWebhookSignature against Node's own HMAC implementation.
// Run: node supabase/tests/cashfree_signature_check.mjs
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { verifyWebhookSignature } from "../functions/_shared/cashfree.ts";

const secret = "cfsk_test_secret";
const ts = "1731900000000";
const body = '{"data":{"order":{"order_id":"KCH-001001"}},"type":"PAYMENT_SUCCESS_WEBHOOK"}';
const good = createHmac("sha256", secret).update(ts + body).digest("base64");

assert.equal(await verifyWebhookSignature(secret, ts, body, good), true, "valid signature");
assert.equal(await verifyWebhookSignature(secret, ts, body + " ", good), false, "tampered body");
assert.equal(await verifyWebhookSignature(secret, "1731900000001", body, good), false, "other timestamp");
assert.equal(await verifyWebhookSignature("wrong", ts, body, good), false, "wrong secret");
assert.equal(await verifyWebhookSignature(secret, ts, body, "Zm9yZ2Vk"), false, "forged");
console.log("cashfree signature ok");
