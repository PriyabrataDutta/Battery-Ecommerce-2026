import { AlertCircle, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AccessExpiredProps {
  reason: string;
  /** Where to send the user to re-authenticate. Defaults to /admin/login with current path as next. */
  loginPath?: string;
  /** Variant: full-page (used standalone) or inline banner (used inside a layout). */
  variant?: "page" | "banner";
}

/**
 * Reusable "Access expired / revoked" UI.
 * - `variant="page"` (default): centered card, used when redirected to login.
 * - `variant="banner"`: amber inline banner, used inside protected pages before redirect.
 */
export function AccessExpired({ reason, loginPath, variant = "page" }: AccessExpiredProps) {
  const location = useLocation();
  const target =
    loginPath ??
    `/admin/login?next=${encodeURIComponent(location.pathname)}&reason=${encodeURIComponent(reason)}`;

  if (variant === "banner") {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"
      >
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="font-semibold">Access expired</div>
          <div>{reason}</div>
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
          <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="font-display-tight text-xl font-bold mb-2">Access expired</h2>
        <p className="text-sm text-muted-foreground mb-6">{reason}</p>
        <Button asChild className="w-full">
          <Link to={target}>
            <LogIn className="h-4 w-4 mr-2" /> Sign in again
          </Link>
        </Button>
      </Card>
    </div>
  );
}
