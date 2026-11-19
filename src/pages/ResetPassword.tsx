import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { passwordSchema } from "@/components/auth/signUpSchema";

const schema = z.object({
  password: passwordSchema,
});

/**
 * Public page that completes a password reset flow. Supabase places the user
 * into a temporary recovery session via the link in the email, so we just
 * call updateUser({ password }) and then route to the dashboard.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The recovery link drops a session in the URL hash. Wait for the auth
    // listener to pick it up before showing the form, otherwise updateUser
    // will fail with "User not authenticated".
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });
    // Also handle the case where the session was set before mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      toast.error(parsed.error.flatten().fieldErrors.password?.[0] ?? "Invalid password");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate("/account", { replace: true });
  };

  return (
    <div className="container-x max-w-md py-12 sm:py-20">
      <div className="text-center"><span className="eyebrow">Account</span></div>
      <h1 className="mt-2 font-display-tight text-3xl sm:text-4xl font-bold text-center">Set a new password</h1>
      <div className="mt-8 surface p-6 sm:p-8">
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">
            Verifying reset link…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              name="password"
              type="password"
              placeholder="New password (8+ characters, letters and numbers)"
              required
              autoComplete="new-password"
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
