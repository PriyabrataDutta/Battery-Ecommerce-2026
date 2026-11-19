/**
 * Post-login redirect target from `?next=`: only same-site paths ("/shop"),
 * never "//evil.com" or "/\\evil.com" (browsers treat those as other hosts).
 */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
