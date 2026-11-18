// Transactional email via Resend. Needs the RESEND_API_KEY function secret.
// Sender comes from site_settings.email_settings ({from_name, from_email});
// until kachibatteries.com is verified in Resend, onboarding@resend.dev is
// the only sender that works (and only to the Resend account's own address).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const DEFAULT_FROM = "Kachi Batteries <onboarding@resend.dev>";

export async function sendEmail(
  admin: SupabaseClient,
  msg: { to: string; subject: string; html: string },
): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const { data } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "email_settings")
    .maybeSingle();
  const s = (data?.value ?? {}) as { from_name?: string; from_email?: string };
  const from = s.from_email ? `${s.from_name || "Kachi Batteries"} <${s.from_email}>` : DEFAULT_FROM;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend ${res.status}: ${body.message ?? res.statusText}`);
  }
}
