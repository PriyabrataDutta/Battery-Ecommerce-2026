import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { setRememberMe } from "@/lib/adminSession";
import { AccessExpired, isAccessExpiredCause } from "@/components/auth/AccessExpired";
import { useCaptcha } from "@/components/auth/Captcha";

const AdminLogin = () => {
  const { user, isStaff, loading, signIn, resetPassword } = useAuth();
  const captcha = useCaptcha();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Login";
  }, []);

  // While auth is still resolving, render a stable loader instead of the form.
  // Without this, the form mounts → useAuth resolves → redirect, causing a
  // visible "dancing" flash of the login UI.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/40 p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user && isStaff) {
    return <Navigate to={next} replace />;
  }

  const fail = (stageLabel: string, message: string, details?: unknown) => {
    console.error(`[AdminLogin] ${stageLabel} failed:`, message, details ?? "");
    setStage(stageLabel);
    setError(message);
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStage(null);
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();
    console.info("[AdminLogin] attempt", { email: normalizedEmail });

    // Stage 1: Email validation
    if (!normalizedEmail) {
      return fail("email-validation", "Please enter your admin email.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return fail("email-validation", "Please enter a valid email address.");
    }
    if (!password) {
      return fail("email-validation", "Please enter your password.");
    }
    // Stage 2: Sign in (no pre-check — is_admin_email is locked down to prevent enumeration)
    console.info("[AdminLogin] stage: sign-in");
    if (!captcha.ready) return fail("email-validation", "Please complete the security check.");
    const { error: signInError } = await signIn(normalizedEmail, password, captcha.token);
    captcha.reset();
    if (signInError) {
      const lower = signInError.toLowerCase();
      const friendly = lower.includes("invalid")
        ? "Invalid email or password."
        : lower.includes("confirm")
          ? "This admin email has not been confirmed yet."
          : signInError;
      return fail("sign-in", friendly, signInError);
    }

    // Stage 4: Auth session
    console.info("[AdminLogin] stage: auth-session");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return fail("auth-session", `Session error: ${sessionError.message}`, sessionError);
    }
    const uid = sessionData.session?.user.id;
    if (!uid) {
      return fail("auth-session", "Sign-in succeeded but no session was returned.");
    }

    // Stage 5: Staff role
    console.info("[AdminLogin] stage: staff-role");
    const { data: staff, error: staffError } = await supabase.rpc("is_staff", { _user_id: uid });
    if (staffError) {
      return fail("staff-role", `Could not verify staff role: ${staffError.message}`, staffError);
    }
    if (!staff) {
      await supabase.auth.signOut();
      return fail(
        "staff-role",
        "This account does not have admin access. If you're a customer, use the customer sign-in.",
      );
    }

    // Stage 6: Persist remember-me preference, then redirect
    setRememberMe(remember);
    const target = next.startsWith("/admin") ? next : "/admin";
    console.info("[AdminLogin] success — redirecting to", target, { remember });
    toast.success("Welcome back", {
      description: remember ? "You'll stay signed in on this browser." : "Session-only login (30 min idle timeout).",
    });
    setSubmitting(false);
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/40 via-background to-muted/40 p-4">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 grid place-items-center mb-3">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display-tight text-2xl font-bold">Admin Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted area. Staff credentials required.
          </p>
        </div>

        {isAccessExpiredCause(params.get("reason")) && (
          <div className="mb-4">
            <AccessExpired
              cause={params.get("reason") as Parameters<typeof AccessExpired>[0]["cause"]}
              variant="banner"
              loginPath="#"
            />
          </div>
        )}

        {user && !isStaff && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You are signed in as <strong>{user.email}</strong> but this account has no admin
              permissions.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
              placeholder="admin@yourstore.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer select-none">
              Remember me on this browser
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {remember
              ? "Stay signed in across browser restarts."
              : "Sign out automatically when you close the browser or after 30 min idle."}
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {stage && (
                  <div className="font-semibold uppercase tracking-wide text-[10px] opacity-80">
                    Failed at: {stage}
                  </div>
                )}
                <div>{error}</div>
              </div>
            </div>
          )}

          {captcha.widget}
          <Button type="submit" className="w-full" disabled={submitting || loading}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign in to Admin
          </Button>

          <button
            type="button"
            className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
            disabled={submitting}
            onClick={async () => {
              const target = email.trim().toLowerCase();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
                toast.error("Enter your admin email first, then click Forgot password.");
                return;
              }
              if (!captcha.ready) {
                toast.error("Complete the security check first, then click Forgot password.");
                return;
              }
              setSubmitting(true);
              const { error: resetError } = await resetPassword(target, captcha.token);
              captcha.reset();
              setSubmitting(false);
              if (resetError) toast.error(resetError);
              else
                toast.success("Reset link sent", {
                  description: "Check your inbox and follow the link to set a new password.",
                });
            }}
          >
            Forgot password?
          </button>
        </form>


        <div className="mt-6 pt-4 border-t border-line text-center text-xs text-muted-foreground">
          Customer? <a href="/auth" className="text-primary hover:underline">Use the customer sign-in</a>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
