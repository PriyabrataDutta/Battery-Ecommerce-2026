// Staff check for edge functions: valid session + 2FA (aal2) + the named permission.
// has_permission runs with the caller's own JWT, so the database's staff 2FA gate
// (staff_mfa_ok) applies too. Never check staff with the service-role client:
// auth.uid() is null there and the 2FA gate is skipped.
import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2.105.1";

export type StaffCheck = { ok: true; user: User } | { ok: false; status: number; error: string };

function jwtAal(token: string): string | undefined {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")))?.aal;
  } catch {
    return undefined;
  }
}

export async function requireStaff(req: Request, permission: string): Promise<StaffCheck> {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false, status: 401, error: "Not authenticated" };
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return { ok: false, status: 401, error: "Invalid session" };
  if (jwtAal(token) !== "aal2") return { ok: false, status: 403, error: "Two-factor sign-in required" };
  const { data: allowed, error: permErr } = await userClient.rpc("has_permission", { _user_id: data.user.id, _perm: permission });
  if (permErr) return { ok: false, status: 500, error: "Permission check failed" };
  if (!allowed) return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true, user: data.user };
}
