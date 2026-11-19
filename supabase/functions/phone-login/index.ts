// Mobile-number sign-in. The phone → email lookup and the password check both
// happen here, so the browser never learns which email (or whether any account)
// belongs to a mobile number. Returns session tokens for supabase.auth.setSession.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { allow, clientIp } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const WRONG = "Wrong email/mobile or password.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { phone, password, captchaToken } = await req.json();
    const normalised = String(phone ?? "").replace(/[^\d+]/g, "");
    if (normalised.length < 8 || normalised.length > 16 || typeof password !== "string" || !password || password.length > 72) {
      return json({ error: WRONG }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 10 attempts / 10 min per IP, 300 / hour overall.
    const ip = clientIp(req);
    if (!(await allow(admin, `phone-login:ip:${ip}`, 10, 600)) || !(await allow(admin, "phone-login:all", 300, 3600))) {
      return json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
    }

    const { data: email, error: lookupError } = await admin.rpc("lookup_email_by_phone", { _phone: normalised });
    if (lookupError) throw lookupError;
    // Unknown number gets the same answer as a wrong password.
    if (!email) return json({ error: WRONG }, 400);

    // ponytail: Supabase Auth sees this function's IP, not the customer's, so its
    // own per-IP sign-in limit is shared by all phone logins; our per-IP limit above
    // is the real one. Move phone login to Supabase phone auth if volume grows.
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("captcha")) return json({ error: "Security check failed. Please complete it again." }, 400);
      if (m.includes("not confirmed")) return json({ error: "Please confirm your email first — check your inbox for the link." }, 400);
      if (m.includes("rate limit") || m.includes("too many")) return json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429);
      return json({ error: WRONG }, 400);
    }
    return json({ access_token: data.session!.access_token, refresh_token: data.session!.refresh_token });
  } catch (_err) {
    return json({ error: "Sign-in failed. Please try again." }, 500);
  }
});
