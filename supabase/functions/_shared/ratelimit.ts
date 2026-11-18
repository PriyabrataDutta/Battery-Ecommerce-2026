// Server-side rate limiting via public.rate_limit_hit (fixed window, service role).
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/** Caller's IP as seen by the Supabase edge (first X-Forwarded-For hop). */
export const clientIp = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

/** True while `key` is within `max` hits per `windowSeconds`. Fails open if the DB check errors. */
export async function allow(admin: SupabaseClient, key: string, max: number, windowSeconds: number) {
  const { data, error } = await admin.rpc("rate_limit_hit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.error("rate_limit_hit failed:", error.message);
    return true;
  }
  return data === true;
}
