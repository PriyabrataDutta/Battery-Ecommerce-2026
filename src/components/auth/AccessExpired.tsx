import { AlertCircle, Clock, ShieldOff, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Causes for which the AccessExpired UI is shown. These represent
 * **involuntary** session terminations only. User-initiated logouts
 * (clicking the Sign out button) MUST NOT use this component — they should
 * redirect straight to /admin/login via PostLogoutRedirect.
 */
export type AccessExpiredCause =
  | "idle-timeout"      // session timed out due to inactivity
  | "ephemeral-orphan"  // browser was closed on a non-remembered session
  | "session-invalid"   // server-side session is no longer valid
  | "token-refresh"     // refresh-token failed
  | "role-revoked";     // staff role was removed while signed in

interface CauseCopy {
  title: string;
  description: string;
  icon: typeof AlertCircle;
}

const CAUSE_COPY: Record<AccessExpiredCause, CauseCopy> = {
  "idle-timeout": {
    title: "Session timed out",
    description: "You were signed out after a period of inactivity. Please sign in again to continue.",
    icon: Clock,
  },
  "ephemeral-orphan": {
    title: "Session ended",
    description: "Your session ended because the browser was closed. Please sign in again.",
    icon: AlertCircle,
  },
  "session-invalid": {
    title: "Session expired",
    description: "Your session has expired. Please sign in again.",
    icon: AlertCircle,
  },
  "token-refresh": {
    title: "Session expired",
    description: "We couldn't refresh your session. Please sign in again.",
    icon: AlertCircle,
  },
  "role-revoked": {
    title: "Access revoked",
    description: "Your admin access has been revoked. Contact a super admin if you believe this is a mistake.",
    icon: ShieldOff,
  },
};

interface AccessExpiredProps {
  cause: AccessExpiredCause;
  /** Where to send the user to re-authenticate. Defaults to /admin/login with current path as next. */
  loginPath?: string;
  /** Variant: full-page (used standalone) or inline banner (used inside a layout). */
  variant?: "page" | "banner";
}

/**
 * Dedicated UI for **involuntary** admin session expiration / revocation.
 *
 * This component intentionally has NO `"user-logout"` cause — the type system
 * enforces that callers cannot render this UI for a deliberate logout.
 * User-initiated logouts are handled by PostLogoutRedirect, which navigates
 * straight to /admin/login without surfacing any banner.
 */
export function AccessExpired({ cause, loginPath, variant = "page" }: AccessExpiredProps) {
  const location = useLocation();
  const copy = CAUSE_COPY[cause];

  // Defensive runtime guard: if an unknown cause slips through (e.g. cast from
  // an untrusted source), render nothing rather than a misleading banner.
  if (!copy) {
    if (import.meta.env.DEV) {
      console.error("[AccessExpired] unknown cause", cause);
    }
    return null;
  }

  const Icon = copy.icon;
  const target =
    loginPath ??
    `/admin/login?next=${encodeURIComponent(location.pathname)}&reason=${encodeURIComponent(cause)}`;

  if (variant === "banner") {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"
      >
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="font-semibold">{copy.title}</div>
          <div>{copy.description}</div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link to={target}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-elevated">
        <div className="h-14 w-14 rounded-full bg-amber-500/10 grid place-items-center mx-auto mb-4">
          <Icon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="font-display-tight text-xl font-bold mb-2">{copy.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">{copy.description}</p>
        <Button asChild className="w-full">
          <Link to={target}>
            <LogIn className="h-4 w-4 mr-2" /> Sign in again
          </Link>
        </Button>
      </Card>
    </div>
  );
}

/** Type guard — narrows an arbitrary string to a valid cause. */
export function isAccessExpiredCause(value: string | null | undefined): value is AccessExpiredCause {
  return !!value && value in CAUSE_COPY;
}
