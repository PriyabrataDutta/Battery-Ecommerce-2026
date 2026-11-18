// Checks the auth-email hook's Standard Webhooks verification against Node's HMAC,
// and that every email template renders. Run: node supabase/tests/auth_email_check.mjs [outdir]
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { verifyStandardWebhook } from "../functions/_shared/standardWebhook.ts";
import { emailTemplates } from "../functions/_shared/emailTemplates.ts";

const keyB64 = Buffer.from("kachi-test-signing-key-123456789").toString("base64");
const secret = `v1,whsec_${keyB64}`;
const body = '{"user":{"email":"a@b.com"},"email_data":{"email_action_type":"signup"}}';
const id = "msg_1", ts = String(Math.floor(Date.now() / 1000));
const sig = createHmac("sha256", Buffer.from(keyB64, "base64")).update(`${id}.${ts}.${body}`).digest("base64");
const h = (o) => new Headers({ "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}`, ...o });

assert.equal(await verifyStandardWebhook(secret, h(), body), true, "valid");
assert.equal(await verifyStandardWebhook(secret, h({ "webhook-signature": `v1,AAAA v1,${sig}` }), body), true, "one of several");
assert.equal(await verifyStandardWebhook(secret, h(), body + " "), false, "tampered body");
assert.equal(await verifyStandardWebhook(secret, h({ "webhook-timestamp": String(Number(ts) - 3600) }), body), false, "old timestamp");
assert.equal(await verifyStandardWebhook(`v1,whsec_${Buffer.from("other").toString("base64")}`, h(), body), false, "wrong secret");

const link = "https://uzpzqkzkdkeboplmgowy.supabase.co/auth/v1/verify?token=abc&type=signup&redirect_to=https%3A%2F%2Fwww.kachibatteries.com%2Faccount";
const all = {
  signup: emailTemplates.signup(link, "Priya Dutta"),
  recovery: emailTemplates.recovery(link, "Priya Dutta"),
  magiclink: emailTemplates.magiclink(link),
  invite: emailTemplates.invite(link),
  email_change: emailTemplates.email_change(link, "new@example.com", "Priya"),
  reauthentication: emailTemplates.reauthentication("482913", "Priya"),
};
for (const [k, t] of Object.entries(all)) {
  assert.ok(t.subject && t.html.includes("KACHI"), k);
  if (k !== "reauthentication") assert.ok(t.html.includes(link.replace(/&/g, "&amp;")), `${k} link`);
}
assert.ok(!emailTemplates.signup(link, "<script>x</script>").html.includes("<script>x"), "name escaped");
if (process.argv[2]) writeFileSync(`${process.argv[2]}/signup-email.html`, all.signup.html);
console.log("auth email ok");
