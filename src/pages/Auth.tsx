import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useCaptcha } from "@/components/auth/Captcha";
import { useGoogleEnabled } from "@/hooks/useGoogleEnabled";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShoppingCart, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { safeNext } from "@/lib/safeNext";
import { clearPendingAdd, hasPendingAdd } from "@/lib/pendingCart";
import { Seo } from "@/components/Seo";



const signInSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile")
    .max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const emailOnlySchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
});

const Auth = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const cartReason = params.get("reason") === "cart" && hasPendingAdd();
  const { user, signInWithIdentifier, signInWithGoogle, resetPassword, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const captcha = useCaptcha();
  const googleEnabled = useGoogleEnabled();

  if (!loading && user) return <Navigate to={next} replace />;

  // Admin-vs-customer routing is enforced server-side (admin emails are linked to
  // the staff profile on sign-up), so we do not probe admin emails from the client.


  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input");
      return;
    }
    setBusy(true);
    const captchaToken = await captcha.getToken();
    if (captcha.enabled && !captchaToken) {
      setBusy(false);
      return toast.error("Security check is still verifying — please wait a moment and try again.");
    }
    const { error } = await signInWithIdentifier(parsed.data.identifier, parsed.data.password, captchaToken);
    captcha.reset();

    setBusy(false);
    if (error) toast.error(error);
    else toast.success("Welcome back");
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle(`${window.location.origin}${next}`);
    if (error) {
      setBusy(false);
      toast.error(error);
    }
    // On success, browser redirects — leave busy=true.
  };

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = emailOnlySchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    const captchaToken = await captcha.getToken();
    if (captcha.enabled && !captchaToken) {
      setBusy(false);
      return toast.error("Security check is still verifying — please wait a moment and try again.");
    }
    const { error } = await resetPassword(parsed.data.email, captchaToken);
    captcha.reset();
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("If an account exists, a reset link is on its way.");
      setForgot(false);
    }
  };

  return (
    <div className="container-x py-10 sm:py-16">
      <Seo title="Sign In or Create Account" description="Sign In or Create Account at Kachi Batteries." noindex />
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-card shadow-elevated lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-hero p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-dots" aria-hidden />
        <div className="relative">
          <span className="eyebrow">Kachi Batteries</span>
          <h2 className="mt-4 font-display-tight text-4xl font-bold">Power that fits your ride.</h2>
          <p className="mt-3 max-w-sm text-white/70">Sign in to check out faster, track deliveries and manage warranty claims.</p>
        </div>
        <ul className="relative space-y-3 text-sm text-white/85">
          <li className="flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-volt" /> 100% genuine brands</li>
          <li className="flex items-center gap-3"><Truck className="h-5 w-5 text-volt" /> Free delivery & installation</li>
          <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-volt" /> Secure sign-in & payments</li>
        </ul>
      </aside>
      <div className="p-6 sm:p-10">
      <span className="eyebrow">Your account</span>
      <h1 className="mt-2 font-display-tight text-3xl sm:text-4xl font-bold">Welcome</h1>
      <p className="text-muted-foreground mt-1">Sign in or create an account.</p>

      {cartReason && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <ShoppingCart className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <div>
            Sign in or create an account and we'll add your battery to the cart.{" "}
            <Link
              to="/shop"
              onClick={clearPendingAdd}
              className="text-primary underline whitespace-nowrap"
            >
              Continue browsing instead
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6">
        {forgot ? (
          <form onSubmit={handleForgot} className="space-y-3">
            <h2 className="font-display font-bold text-lg">Reset your password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </p>
            <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
            {captcha.widget}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send reset link
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setForgot(false)}
              disabled={busy}
            >
              Back to sign in
            </Button>
          </form>
        ) : (
          <>
            {googleEnabled && (
              <>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GoogleIcon className="h-4 w-4 mr-2" />}
                  Continue with Google
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-line" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground tracking-wider">or</span>
                  </div>
                </div>
              </>
            )}
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full rounded-full h-11 p-1">
                <TabsTrigger value="signin" className="rounded-full">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 mt-4">
                  <Input
                    name="identifier"
                    type="text"
                    placeholder="Email or mobile number"
                    required
                    autoComplete="username"
                  />
                  <Input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
                  {captcha.widget}
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
                    className="block w-full text-center text-xs text-muted-foreground hover:text-primary mt-2"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        By continuing you agree to our terms. <Link to="/" className="underline">Back to store</Link>
      </p>
      </div>
      </div>
    </div>
  );
};

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default Auth;
