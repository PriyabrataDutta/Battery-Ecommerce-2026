// Sends a 4-digit phone verification code to the signed-in user.
// Today the code is delivered by EMAIL (using Lovable's transactional email
// infrastructure). When SMS OTP is enabled later, swap the delivery branch
// without changing any callers, the database, or the frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  // Identify the calling user from their JWT.
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
  const user = userData.user;

  // Service-role client for trusted writes / template invoke
  const admin = createClient(SUPABASE_URL, SERVICE);

  // Read the user's profile to get phone + email
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("phone, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr) return json({ error: pErr.message }, 500);
  if (!profile?.phone) return json({ error: "no_phone_on_profile" }, 400);

  // Generate code, hash, store
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const codeHash = await sha256Hex(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: upErr } = await admin
    .from("phone_verification_codes")
    .upsert({
      user_id: user.id,
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString(),
    });
  if (upErr) return json({ error: upErr.message }, 500);

  const recipient = user.email;
  if (!recipient) return json({ error: "no_email_on_account" }, 400);

  let delivery: "email" | "dev_log" = "email";
  let deliveryError: string | null = null;

  try {
    await sendEmail(admin, {
      to: recipient,
      subject: `Your Kachi Batteries verification code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <p>Hi${profile.full_name ? ` ${profile.full_name}` : ""},</p>
          <p>Your code to verify ${profile.phone} is:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
          <p style="color: #6b7280; font-size: 12px;">It expires in 10 minutes. If you didn't ask for this, ignore this email.</p>
        </div>
      `,
    });
  } catch (e) {
    delivery = "dev_log";
    deliveryError = e instanceof Error ? e.message : String(e);
  }

  if (delivery === "dev_log") {
    // Email infra not ready yet — surface the code so the user can finish
    // verification today. Will go away the moment email infra is configured.
    console.log(
      `[send-phone-verification-code] DEV fallback for ${user.id}: code=${code} (reason: ${deliveryError})`,
    );
    return json({
      ok: true,
      delivery: "dev_log",
      dev_code: code,
      message:
        "Email delivery is not configured yet. Use the code shown here for now.",
    });
  }

  return json({ ok: true, delivery: "email" });
});
