// Cashfree payment webhook (verify_jwt = false). Set this URL in the Cashfree
// dashboard → Developers → Webhooks. The signature is checked, then the order
// is re-read from Cashfree's API before anything is marked paid.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCashfreeConfig, syncOrderPayment, verifyWebhookSignature } from "../_shared/cashfree.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cfg = await getCashfreeConfig(admin).catch(() => null);
    if (!cfg) return new Response("payments not configured", { status: 503 });

    // Reject bad signatures and anything older than 10 minutes (replays).
    const age = Math.abs(Date.now() - Number(timestamp));
    if (!timestamp || !signature || !(await verifyWebhookSignature(cfg.secret, timestamp, raw, signature)) || !(age < 10 * 60 * 1000)) {
      return new Response("invalid signature", { status: 401 });
    }

    const orderNumber = JSON.parse(raw)?.data?.order?.order_id;
    if (typeof orderNumber === "string" && orderNumber) {
      const r = await syncOrderPayment(admin, cfg, orderNumber);
      console.log(`cashfree-webhook ${orderNumber}: ${r.state}`);
    }
    return new Response("ok");
  } catch (e) {
    console.error("cashfree-webhook:", e);
    return new Response("error", { status: 500 }); // Cashfree retries on non-2xx
  }
});
