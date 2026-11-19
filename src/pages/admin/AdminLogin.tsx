import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, AlertCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { setRememberMe } from "@/lib/adminSession";
import { AccessExpired, isAccessExpiredCause } from "@/components/auth/AccessExpired";
import { useCaptcha } from "@/components/auth/Captcha";
import { TotpQr } from "@/components/auth/TotpQr";
import { safeNext } from "@/lib/safeNext";

const AdminLogin = () => {
  const { user, isStaff, loading, signIn, resetPassword } = useAuth();
  const captcha = useCaptcha();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"), "/admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  // Second step for staff: verify an authenticator code, or set one up (first login).
  const [mfa, setMfa] = useState<
    { mode: "verify"; factorId: string } | { mode: "enroll"; factorId: string; qr: string; secret: string } | null
  >(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    document.title = "Admin Login";
  }, []);

  /** Staff session still at password level → show the 2FA step. Returns true if shown. */
  // One run at a time: the form submit and the resume effect can both fire.
  const mfaRun = useRef<Promise<boolean> | null>(null);
  const startMfa = () => (mfaRun.current ??= runMfa().finally(() => (mfaRun.current = null)));
  const runMfa = async (): Promise<boolean> => {
    const { data: needs } = await supabase.rpc("staff_needs_mfa");
    if (!needs) return false;
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const verified = factors.totp[0];
    if (verified) {
      setMfa({ mode: "verify", factorId: verified.id });
      return true;
    }
    // Drop half-finished setups so enrolling again doesn't clash.
    for (const f of factors.all.filter((f) => f.status === "unverified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Kachi Admin ${new Date().toISOString().slice(0, 10)}`,
      issuer: "Kachi Batteries",
    });
    if (enrollError) throw enrollError;
    setMfa({ mode: "enroll", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    return true;
  };

  // Reloaded mid-login (signed in, 2FA not done yet) → resume at the 2FA step.
  useEffect(() => {
    if (!loading && user && !isStaff && !mfa) startMfa().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, isStaff]);

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
    const captchaToken = await captcha.getToken();
    if (captcha.enabled && !captchaToken) return fail("email-validation", "Security check is still verifying — please wait a moment and try again.");
    const { error: signInError } = await signIn(normalizedEmail, password, captchaToken);
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

    // Stage 3: two-factor
    try {
      if (await startMfa()) {
        setSubmitting(false);
        return;
      }
    } catch (e) {
      return fail("two-factor", e instanceof Error ? e.message : "Could not start two-factor sign-in.", e);
    }
    await finishLogin();
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfa) return;
    if (!/^\d{6}$/.test(code)) return fail("two-factor", "Enter the 6-digit code from your authenticator app.");
    setError(null);
    setSubmitting(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfa.factorId, code });
    if (verifyError) {
      setCode("");
      return fail("two-factor", "That code didn't match. Check the time on your phone and try the newest code.", verifyError);
    }
    await finishLogin();
  };

  const finishLogin = async () => {
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

        {user && !isStaff && !mfa && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              You are signed in as <strong>{user.email}</strong> but this account has no admin
              permissions.
            </span>
          </div>
        )}

        {mfa ? (
          <form onSubmit={handleCode} className="space-y-4">
            {mfa.mode === "enroll" ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                  <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p>
                    <strong>Set up two-factor sign-in (one time).</strong> Admin accounts need a code from an
                    authenticator app — Google Authenticator, Microsoft Authenticator or Authy.
                  </p>
                </div>
                <TotpQr qr={mfa.qr} secret={mfa.secret} />
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <Smartphone className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <p>Enter the 6-digit code from your authenticator app for Kachi Batteries.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="mfa-code">Authenticator code</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="text-center tracking-[0.4em] text-lg"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mfa.mode === "enroll" ? "Turn on two-factor & sign in" : "Verify & sign in"}
            </Button>
            <button
              type="button"
              className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
              onClick={async () => {
                await supabase.auth.signOut();
                setMfa(null);
                setCode("");
                setError(null);
              }}
            >
              Cancel and sign out
            </button>
            {mfa.mode === "verify" && (
              <p className="text-[11px] text-muted-foreground text-center">
                Lost your phone? Ask another admin to reset your two-factor in Team.
              </p>
            )}
          </form>
        ) : (
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
              setSubmitting(true);
              const captchaToken = await captcha.getToken();
              if (captcha.enabled && !captchaToken) {
                setSubmitting(false);
                toast.error("Security check is still verifying — please wait a moment and try again.");
                return;
              }
              const { error: resetError } = await resetPassword(target, captchaToken);
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
        )}


        <div className="mt-6 pt-4 border-t border-line text-center text-xs text-muted-foreground">
          Customer? <a href="/auth" className="text-primary hover:underline">Use the customer sign-in</a>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
