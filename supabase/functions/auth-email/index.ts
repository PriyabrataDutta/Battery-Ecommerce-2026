// Supabase Auth "Send Email" hook (verify_jwt = false). Supabase calls this for
// sign-up confirmation, password reset, magic link, invite, email change and
// re-authentication; we send branded emails through Resend.
// Setup: Authentication → Hooks → Send Email → HTTPS → this function's URL;
// put the generated secret in the function secret SEND_EMAIL_HOOK_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendEmail } from "../_shared/email.ts";
import { emailTemplates } from "../_shared/emailTemplates.ts";
import { verifyStandardWebhook } from "../_shared/standardWebhook.ts";

type Payload = {
  user: { email: string; new_email?: string; user_metadata?: { full_name?: string } };
  email_data: {
    token: string;
    token_hash: string;
    token_new?: string;
    token_hash_new?: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail(405, "method not allowed");
  const body = await req.text();
  const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secret) return fail(500, "Email hook is not configured");
  if (!(await verifyStandardWebhook(secret, req.headers, body))) return fail(401, "invalid signature");

  try {
    const { user, email_data: d } = JSON.parse(body) as Payload;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const name = user.user_metadata?.full_name ?? null;
    const link = (tokenHash: string) =>
      `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(d.email_action_type)}` +
      `&redirect_to=${encodeURIComponent(d.redirect_to || d.site_url)}`;

    const send = (to: string, t: { subject: string; html: string }) => sendEmail(admin, { to, ...t });

    switch (d.email_action_type) {
      case "signup":
        await send(user.email, emailTemplates.signup(link(d.token_hash), name));
        break;
      case "recovery":
        await send(user.email, emailTemplates.recovery(link(d.token_hash), name));
        break;
      case "magiclink":
        await send(user.email, emailTemplates.magiclink(link(d.token_hash), name));
        break;
      case "invite":
        await send(user.email, emailTemplates.invite(link(d.token_hash)));
        break;
      case "email_change":
      case "email_change_new":
        // Supabase pairs token_hash_new with the CURRENT address and token_hash with the new one.
        if (d.token_hash_new) await send(user.email, emailTemplates.email_change(link(d.token_hash_new), user.new_email ?? "", name));
        if (user.new_email && d.token_hash) await send(user.new_email, emailTemplates.email_change(link(d.token_hash), user.new_email, name));
        break;
      case "reauthentication":
        await send(user.email, emailTemplates.reauthentication(d.token, name));
        break;
      default:
        return fail(400, `unsupported email type ${d.email_action_type}`);
    }
    return new Response("{}", { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("auth-email:", e);
    return fail(500, e instanceof Error ? e.message : "could not send email");
  }
});
