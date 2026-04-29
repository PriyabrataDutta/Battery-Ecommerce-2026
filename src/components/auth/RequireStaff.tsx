import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REVERIFY_INTERVAL_MS = 60_000; // re-check every 60s

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, signOut } = useAuth();
  const location = useLocation();
  const [forcedOut, setForcedOut] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const verify = async (reason: string) => {
      // 1. Server-verified session check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError || !sessionData.session) {
        console.warn("[RequireStaff] session invalid", { reason, sessionError });
        await signOut();
        setForcedOut("Your session has expired. Please sign in again.");
        toast.error("Session expired", { description: "Please sign in again." });
        return;
      }

      // 2. Server-verified staff role check
      const { data: staff, error: staffError } = await supabase.rpc("is_staff", {
        _user_id: sessionData.session.user.id,
      });
      if (cancelled) return;
      if (staffError || !staff) {
        console.warn("[RequireStaff] staff role revoked", { reason, staffError });
        await signOut();
        setForcedOut("Your admin access has been revoked.");
        toast.error("Access revoked", { description: "Your staff role is no longer active." });
      }
    };

    // Verify immediately on mount, then on interval
    verify("mount");
    const interval = window.setInterval(() => verify("interval"), REVERIFY_INTERVAL_MS);

    // React to auth events (token refresh failures, sign-out from another tab)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        setForcedOut("Your session has expired. Please sign in again.");
      }
    });

    // Re-verify on tab focus (catches expirations while tab was hidden)
    const onFocus = () => verify("focus");
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [user, signOut]);

  if (loading) {
    return <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!user || !isStaff || forcedOut) {
    return (
      <Navigate
        to={`/admin/login?next=${encodeURIComponent(location.pathname)}${
          forcedOut ? `&reason=${encodeURIComponent(forcedOut)}` : ""
        }`}
        replace
      />
    );
  }
  return <>{children}</>;
}
