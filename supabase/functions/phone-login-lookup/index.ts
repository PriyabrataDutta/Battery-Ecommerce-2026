import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { allow, clientIp } from "../_shared/ratelimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    const normalised = String(phone ?? "").replace(/[^\d+]/g, "");

    // Basic validation — reject anything that can't be a phone number.
    if (normalised.length < 8 || normalised.length > 16) {
      return new Response(JSON.stringify({ email: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Stops phone-number → email enumeration: 10 lookups / 10 min / IP, 300 / hour overall.
    const ip = clientIp(req);
    if (!(await allow(supabase, `phone-lookup:ip:${ip}`, 10, 600)) || !(await allow(supabase, "phone-lookup:all", 300, 3600))) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please wait a few minutes and try again." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.rpc("lookup_email_by_phone", { _phone: normalised });
    if (error) throw error;

    return new Response(JSON.stringify({ email: data ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    // Never leak internals to the client.
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
