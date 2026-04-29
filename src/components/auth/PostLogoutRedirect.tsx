import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  consumeIntentionalSignOut,
  clearAdminSessionFlags,
  markIntentionalSignOut,
} from "@/lib/adminSession";

/**
 * Route guard for /admin/*. Whenever Supabase fires SIGNED_OUT while the user
 * is anywhere under /admin, this guard:
 *   1. Consumes the intentional-signout flag (set by the logout buttons).
 *   2. Clears any cached admin session flags (idle timer, ephemeral marker).
 *   3. Hard-redirects to /admin/login, replacing history so the back button
 *      cannot reopen a protected page.
 *
 * Because this runs at the route level — above RequireStaff — the
 * AccessExpired banner inside RequireStaff is bypassed entirely for
 * user-initiated logouts. Involuntary expirations (idle, revoked, token
 * refresh failure) will not have the intentional flag set, so RequireStaff
 * still owns that UX.
 */
export function PostLogoutRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_OUT" && !(event === "TOKEN_REFRESHED" && !session)) {
        return;
      }
      // Only act inside the admin area.
      if (!location.pathname.startsWith("/admin")) return;
      // Already on the login page — nothing to do.
      if (location.pathname === "/admin/login") return;

      const intentional = consumeIntentionalSignOut();
      if (!intentional) return; // let RequireStaff handle involuntary expiries

      clearAdminSessionFlags();
      navigate("/admin/login", { replace: true });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return <Outlet />;
}

/**
 * Convenience wrapper for logout buttons: marks the signout as intentional,
 * signs the user out, clears flags, and navigates to /admin/login. Components
 * may call this directly instead of orchestrating the steps inline.
 */
export async function performAdminLogout(opts: { global?: boolean } = {}) {
  markIntentionalSignOut();
  await supabase.auth.signOut(opts.global ? { scope: "global" } : undefined);
  clearAdminSessionFlags();
}
