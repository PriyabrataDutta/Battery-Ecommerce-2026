// Cashfree online payment for an existing order (created by place_order).
// POST { action: "create" | "verify", order_number }  — signed-in customer, own order
// POST { action: "ping" }                              — staff: test the saved keys
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { cfFetch, getCashfreeConfig, syncOrderPayment } from "../_shared/cashfree.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = "https://www.kachibatteries.com";
const ALLOWED_ORIGINS = [SITE, "https://kachibatteries.com", "https://battery-ecommerce-2026.vercel.app", "http://localhost:8080"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Please sign in" }, 401);

    const { action, order_number } = await req.json().catch(() => ({}));

    if (action === "ping") {
      const { data: isStaff } = await admin.rpc("is_staff", { _user_id: user.id });
      if (!isStaff) return json({ error: "Forbidden" }, 403);
      const cfg = await getCashfreeConfig(admin);
      const r = await cfFetch(cfg, "/orders/kachi-connection-test");
      // 404 = keys accepted, order just doesn't exist. 401/403 = bad keys.
      if (r.status === 404) return json({ ok: true, mode: cfg.mode });
      return json({ ok: false, mode: cfg.mode, error: r.body?.message ?? `HTTP ${r.status}` });
    }

    if (typeof order_number !== "string" || !order_number) return json({ error: "order_number required" }, 400);
    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, order_number, total, status, payment_status, payment_method, cashfree_order_id, customer_name, customer_email, customer_phone")
      .eq("order_number", order_number)
      .maybeSingle();
    if (!order || order.user_id !== user.id) return json({ error: "Order not found" }, 404);

    const cfg = await getCashfreeConfig(admin);

    if (action === "verify") {
      const r = order.payment_status === "paid" ? { state: "already_paid" } : await syncOrderPayment(admin, cfg, order_number);
      const { data: now } = await admin.from("orders").select("status, payment_status").eq("id", order.id).single();
      return json({ ...r, status: now?.status, payment_status: now?.payment_status });
    }

    if (action !== "create") return json({ error: "Unknown action" }, 400);
    if (order.payment_method !== "Online (Cashfree)") return json({ error: "This order is not an online-payment order" }, 400);
    if (order.payment_status === "paid") return json({ error: "This order is already paid" }, 409);
    if (order.status !== "pending") return json({ error: "This order can no longer be paid" }, 409);

    // Retry: reuse the Cashfree order while it is still open.
    if (order.cashfree_order_id) {
      const r = await cfFetch(cfg, `/orders/${encodeURIComponent(order_number)}`);
      if (r.ok && r.body.order_status === "ACTIVE") {
        return json({ payment_session_id: r.body.payment_session_id, mode: cfg.mode === "live" ? "production" : "sandbox" });
      }
      if (r.ok && r.body.order_status === "PAID") {
        await syncOrderPayment(admin, cfg, order_number);
        return json({ error: "This order is already paid" }, 409);
      }
      return json({ error: "The payment window for this order has closed. Please place the order again." }, 409);
    }

    const origin = req.headers.get("Origin") ?? "";
    const site = ALLOWED_ORIGINS.includes(origin) ? origin : SITE;
    const phone = String(order.customer_phone ?? "").replace(/\D/g, "").slice(-10);
    const r = await cfFetch(cfg, "/orders", {
      method: "POST",
      body: JSON.stringify({
        order_id: order_number,
        order_amount: Number(order.total),
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: order.customer_name ?? undefined,
          customer_email: order.customer_email ?? user.email,
          customer_phone: phone,
        },
        order_meta: {
          return_url: `${site}/order-confirmation?order=${encodeURIComponent(order_number)}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
        // Closes before our 30-minute stock release, so no payment can land after it.
        order_expiry_time: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      }),
    });
    if (!r.ok) return json({ error: `Cashfree: ${r.body?.message ?? `HTTP ${r.status}`}` }, 502);

    await admin.from("orders").update({ cashfree_order_id: String(r.body.cf_order_id) }).eq("id", order.id);
    return json({ payment_session_id: r.body.payment_session_id, mode: cfg.mode === "live" ? "production" : "sandbox" });
  } catch (e) {
    console.error("cashfree-order:", e);
    return json({ error: e instanceof Error ? e.message : "Payment error" }, 500);
  }
});
