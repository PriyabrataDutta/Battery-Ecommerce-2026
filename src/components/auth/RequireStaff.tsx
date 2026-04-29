import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  isOrphanedEphemeralSession,
  isIdleExpired,
  touchActivity,
  clearAdminSessionFlags,
  setIdleTimeoutMinutes,
  getIdleTimeoutMs,
} from "@/lib/adminSession";

const REVERIFY_INTERVAL_MS = 60_000; // re-check every 60s

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { user, isStaff, loading, signOut } = useAuth();
  const location = useLocation();
  const [forcedOut, setForcedOut] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const auditAndSignOut = async (
      action: "admin.session_expired" | "admin.access_revoked",
      userId: string,
      details: Record<string, unknown>,
    ) => {
      // Audit FIRST — admin_log() requires is_staff(auth.uid()), so we must
      // log before signOut() invalidates the session.
      try {
        await supabase.rpc("admin_log", {
          _action: action,
          _entity_type: "session",
          _entity_id: userId,
          _diff: {
            user_id: userId,
            at: new Date().toISOString(),
            path: location.pathname,
            ...details,
          },
        });
      } catch (e) {
        console.error("[RequireStaff] audit log failed", e);
      }
      await signOut();
    };

    const verify = async (reason: string) => {
      // 0. Client-side ephemeral / idle checks (cheap, run first)
      if (isOrphanedEphemeralSession()) {
        console.warn("[RequireStaff] orphaned ephemeral session — browser was closed");
        if (user) {
          await auditAndSignOut("admin.session_expired", user.id, {
            reason: "ephemeral-orphan",
          });
        } else {
          await signOut();
        }
        clearAdminSessionFlags();
        setForcedOut("You were signed out because the browser was closed.");
        return;
      }
      if (isIdleExpired()) {
        console.warn("[RequireStaff] idle timeout exceeded");
        if (user) {
          await auditAndSignOut("admin.session_expired", user.id, { reason: "idle-timeout" });
        } else {
          await signOut();
        }
        clearAdminSessionFlags();
        setForcedOut("You were signed out after 30 minutes of inactivity.");
        toast.error("Idle timeout", { description: "Please sign in again." });
        return;
      }

      // 1. Server-verified session check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError || !sessionData.session) {
        console.warn("[RequireStaff] session invalid", { reason, sessionError });
        if (user) {
          await auditAndSignOut("admin.session_expired", user.id, {
            reason,
            error: sessionError?.message,
          });
        } else {
          await signOut();
        }
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
        await auditAndSignOut("admin.access_revoked", sessionData.session.user.id, {
          reason,
          error: staffError?.message,
        });
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

    // Track user activity for idle-timeout (throttled to 1/30s)
    let lastTouch = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouch > 30_000) {
        lastTouch = now;
        touchActivity();
      }
    };
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
    };
  }, [user, signOut, location.pathname]);

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
