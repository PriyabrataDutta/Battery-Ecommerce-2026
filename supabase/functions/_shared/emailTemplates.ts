// Branded transactional email HTML (table layout + inline styles for email clients).
const BRAND = "#c8102e";
const INK = "#0d0d0d";
const MUTED = "#5b5b5b";
const SITE = "https://www.kachibatteries.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(opts: { preheader: string; title: string; body: string; cta?: { label: string; url: string }; footnote?: string }) {
  const cta = opts.cta
    ? `<tr><td align="center" style="padding:8px 0 24px">
         <a href="${esc(opts.cta.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px">${esc(opts.cta.label)}</a>
       </td></tr>
       <tr><td style="font-size:12px;color:${MUTED};padding-bottom:20px;word-break:break-all">
         If the button doesn't work, copy this link into your browser:<br><a href="${esc(opts.cta.url)}" style="color:${BRAND}">${esc(opts.cta.url)}</a>
       </td></tr>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e3e3e3">
      <tr><td style="background:${INK};padding:18px 28px">
        <a href="${SITE}" style="color:#ffffff;text-decoration:none;font-size:20px;font-weight:800;letter-spacing:1px">KACHI <span style="color:${BRAND}">BATTERIES</span></a>
      </td></tr>
      <tr><td style="height:4px;background:${BRAND};font-size:0;line-height:0">&nbsp;</td></tr>
      <tr><td style="padding:28px 28px 8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:22px;font-weight:800;padding-bottom:12px">${esc(opts.title)}</td></tr>
          <tr><td style="font-size:15px;line-height:1.6;color:${INK};padding-bottom:20px">${opts.body}</td></tr>
          ${cta}
          ${opts.footnote ? `<tr><td style="font-size:12px;line-height:1.5;color:${MUTED};padding-bottom:24px">${opts.footnote}</td></tr>` : ""}
        </table>
      </td></tr>
      <tr><td style="background:#fafafa;border-top:1px solid #eeeeee;padding:16px 28px;font-size:12px;line-height:1.5;color:${MUTED}">
        Kachi Batteries · Car &amp; inverter batteries with doorstep installation<br>
        <a href="${SITE}" style="color:${MUTED}">kachibatteries.com</a> · This is an automated message about your account.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

const hello = (name?: string | null) => (name ? `Hi ${esc(name.split(" ")[0])},` : "Hi,");

export const emailTemplates = {
  signup: (link: string, name?: string | null) => ({
    subject: "Confirm your email — Kachi Batteries",
    html: layout({
      preheader: "One click to activate your Kachi Batteries account.",
      title: "Welcome to Kachi Batteries",
      body: `${hello(name)}<br><br>Thanks for creating an account. Please confirm your email address to activate it — then you can check out faster, track your orders and save your addresses.`,
      cta: { label: "Confirm my email", url: link },
      footnote: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
    }),
  }),
  recovery: (link: string, name?: string | null) => ({
    subject: "Reset your password — Kachi Batteries",
    html: layout({
      preheader: "Reset your Kachi Batteries password.",
      title: "Reset your password",
      body: `${hello(name)}<br><br>We received a request to reset the password for your account. Click below to choose a new one.`,
      cta: { label: "Reset password", url: link },
      footnote: "This link expires in 1 hour. If you didn't ask for a reset, ignore this email — your password stays the same.",
    }),
  }),
  magiclink: (link: string, name?: string | null) => ({
    subject: "Your sign-in link — Kachi Batteries",
    html: layout({
      preheader: "Your one-time sign-in link.",
      title: "Sign in to Kachi Batteries",
      body: `${hello(name)}<br><br>Use the button below to sign in. The link works once.`,
      cta: { label: "Sign in", url: link },
      footnote: "If you didn't request this, you can ignore this email.",
    }),
  }),
  invite: (link: string) => ({
    subject: "You're invited to Kachi Batteries",
    html: layout({
      preheader: "Accept your invitation.",
      title: "You've been invited",
      body: "You've been invited to create an account at Kachi Batteries. Click below to accept and set your password.",
      cta: { label: "Accept invitation", url: link },
    }),
  }),
  email_change: (link: string, newEmail: string, name?: string | null) => ({
    subject: "Confirm your new email — Kachi Batteries",
    html: layout({
      preheader: "Confirm your email change.",
      title: "Confirm your email change",
      body: `${hello(name)}<br><br>Please confirm changing your account email to <strong>${esc(newEmail)}</strong>.`,
      cta: { label: "Confirm email change", url: link },
      footnote: "If you didn't request this change, please contact us right away.",
    }),
  }),
  reauthentication: (code: string, name?: string | null) => ({
    subject: "Your security code — Kachi Batteries",
    html: layout({
      preheader: `Your security code is ${code}.`,
      title: "Confirm it's you",
      body: `${hello(name)}<br><br>Your security code is:<br><span style="display:inline-block;margin-top:10px;font-size:30px;font-weight:800;letter-spacing:6px">${esc(code)}</span>`,
      footnote: "If you didn't request this, change your password.",
    }),
  }),
};
