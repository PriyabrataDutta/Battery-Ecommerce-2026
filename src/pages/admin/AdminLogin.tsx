import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const { user, isStaff, loading, signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Login";
  }, []);

  if (!loading && user && isStaff) {
    return <Navigate to={next} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your admin email.");
      setSubmitting(false);
      return;
    }

    // Verify the email is registered as an admin BEFORE signing in
    const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin_email", {
      _email: normalizedEmail,
    });
    if (rpcError) {
      setError("Could not verify admin status. Please try again.");
      setSubmitting(false);
      return;
    }
    if (!isAdmin) {
      setError("This email is not registered as an admin account.");
      setSubmitting(false);
      return;
    }

    const { error: signInError } = await signIn(normalizedEmail, password);
    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }
    // Double-check staff role on the resulting session
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) {
      setError("Sign-in failed. Please try again.");
      setSubmitting(false);
      return;
    }
    const { data: staff } = await supabase.rpc("is_staff", { _user_id: uid });
    if (!staff) {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access.");
      setSubmitting(false);
      return;
    }
    toast.success("Welcome back");
    setSubmitting(false);
    navigate(next, { replace: true });
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

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting || loading}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign in to Admin
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center text-xs text-muted-foreground">
          Customer? <a href="/auth" className="text-primary hover:underline">Use the customer sign-in</a>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
