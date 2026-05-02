import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user is staff
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isStaff } = await supabase.rpc("is_staff", { _user_id: user.id });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const to = body?.to;
    if (!to || typeof to !== "string" || !to.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid 'to' email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMTP config from site_settings
    const { data: smtpRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "smtp_config")
      .maybeSingle();

    const { data: pwRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "smtp_password")
      .maybeSingle();

    if (!smtpRow?.value) {
      return new Response(JSON.stringify({ error: "SMTP not configured. Save settings first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smtp = smtpRow.value as Record<string, unknown>;
    const password = (pwRow?.value as string) ?? "";
    const host = smtp.host as string;
    const port = smtp.port as number;
    const username = smtp.username as string;
    const fromName = (smtp.from_name as string) || "Test";
    const fromEmail = (smtp.from_email as string) || username;
    const encryption = (smtp.encryption as string) || "tls";

    if (!host || !username) {
      return new Response(JSON.stringify({ error: "SMTP host and username are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Deno's built-in SMTP via denopkg
    // For simplicity, we use a raw SMTP connection approach
    // In production, you'd use a proper SMTP library
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: encryption === "ssl",
        auth: {
          username,
          password,
        },
      },
    });

    await client.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject: "✅ SMTP Test Email - Configuration Working",
      content: "auto",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">✅ SMTP Configuration Working</h2>
          <p>This is a test email from your admin settings.</p>
          <p><strong>SMTP Host:</strong> ${host}</p>
          <p><strong>Port:</strong> ${port}</p>
          <p><strong>Encryption:</strong> ${encryption.toUpperCase()}</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Sent at ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SMTP test error:", err);
    return new Response(JSON.stringify({ error: err.message || "SMTP test failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
