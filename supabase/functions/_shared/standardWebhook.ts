// Standard Webhooks signature check (used by Supabase Auth hooks).
// Header webhook-signature: "v1,<base64 HMAC-SHA256(id.timestamp.body)>" (space-separated list).
// Secret format: "v1,whsec_<base64 key>".
export async function verifyStandardWebhook(secret: string, headers: Headers, body: string, toleranceSec = 300) {
  const id = headers.get("webhook-id") ?? "";
  const ts = headers.get("webhook-timestamp") ?? "";
  const sigs = (headers.get("webhook-signature") ?? "").split(" ");
  if (!id || !ts || !sigs[0]) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > toleranceSec) return false;

  const keyB64 = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  return sigs.some((s) => {
    const [ver, val] = s.split(",");
    if (ver !== "v1" || !val || val.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < val.length; i++) diff |= val.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}
