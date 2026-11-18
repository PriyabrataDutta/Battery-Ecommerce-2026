// Cashfree PG helpers (API version pinned). Config: site_settings.payment_gateway
// (mode, cashfree.{test,live}.app_id); secrets: private_settings.payment_secrets
// (cashfree_test_secret / cashfree_live_secret). Service-role client required.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const API_VERSION = "2023-08-01";

export interface CashfreeConfig {
  mode: "test" | "live";
  base: string;
  appId: string;
  secret: string;
}

export async function getCashfreeConfig(admin: SupabaseClient): Promise<CashfreeConfig> {
  const [{ data: g }, { data: s }] = await Promise.all([
    admin.from("site_settings").select("value").eq("key", "payment_gateway").maybeSingle(),
    admin.from("private_settings").select("value").eq("key", "payment_secrets").maybeSingle(),
  ]);
  const gw = (g?.value ?? {}) as { mode?: "test" | "live"; cashfree?: Record<string, { app_id?: string }> };
  const mode = gw.mode === "live" ? "live" : "test";
  const appId = gw.cashfree?.[mode]?.app_id ?? "";
  const secret = ((s?.value ?? {}) as Record<string, string>)[`cashfree_${mode}_secret`] ?? "";
  if (!appId || !secret) throw new Error(`Cashfree ${mode} App ID / Secret Key not set in Admin → Settings → Payment`);
  return {
    mode,
    base: mode === "live" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg",
    appId,
    secret,
  };
}

export async function cfFetch(cfg: CashfreeConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "x-client-id": cfg.appId,
      "x-client-secret": cfg.secret,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

/**
 * Ask Cashfree for the order's state and record a confirmed payment.
 * The only path that marks an order paid — webhooks and the return page both
 * end here, so a forged callback can never mark an order paid by itself.
 */
export async function syncOrderPayment(admin: SupabaseClient, cfg: CashfreeConfig, orderNumber: string) {
  const r = await cfFetch(cfg, `/orders/${encodeURIComponent(orderNumber)}`);
  if (!r.ok) return { state: "unknown", detail: r.body?.message ?? `HTTP ${r.status}` };
  const cfStatus: string = r.body.order_status; // ACTIVE | PAID | EXPIRED | TERMINATED ...
  if (cfStatus !== "PAID") return { state: cfStatus.toLowerCase() };

  const p = await cfFetch(cfg, `/orders/${encodeURIComponent(orderNumber)}/payments`);
  const success = Array.isArray(p.body) ? p.body.find((x: { payment_status: string }) => x.payment_status === "SUCCESS") : null;
  const { data, error } = await admin.rpc("mark_order_paid", {
    p_order_number: orderNumber,
    p_payment_ref: String(success?.cf_payment_id ?? r.body.cf_order_id ?? ""),
    p_amount: Number(r.body.order_amount),
  });
  if (error) throw error;
  return { state: data as string };
}

/** Cashfree webhook signature: base64(HMAC-SHA256(timestamp + rawBody, secret)). */
export async function verifyWebhookSignature(secret: string, timestamp: string, rawBody: string, signature: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
