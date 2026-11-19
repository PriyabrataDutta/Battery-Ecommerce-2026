import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useCaptcha } from "@/components/auth/Captcha";
import { passwordSchema } from "@/components/auth/signUpSchema";
import { verifyPassword } from "@/api/auth";
import { TwoFactorCard } from "./TwoFactorCard";

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Passwords do not match" })
  .refine((v) => v.next !== v.current, { message: "New password must differ from the current one" });

export function SecurityTab() {
  const { user } = useAuth();
  const captcha = useCaptcha();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ current, next, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    if (!user?.email) {
      toast.error("No signed-in account found");
      return;
    }
    setBusy(true);
    const captchaToken = await captcha.getToken();
    if (captcha.enabled && !captchaToken) {
      setBusy(false);
      toast.error("Security check is still verifying — please wait a moment and try again.");
      return;
    }
    // Check the current password without replacing this (2FA) session.
    const reauthError = await verifyPassword(user.email, current, captchaToken);
    captcha.reset();
    if (reauthError) {
      setBusy(false);
      toast.error("Current password is incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated", {
      description: "Use your new password the next time you sign in.",
    });
  };

  return (
    <div className="space-y-6">
    <TwoFactorCard />
    <Card className="p-6 max-w-lg">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-4 w-4 text-primary" />
        <h2 className="font-display font-bold text-lg">Change password</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Signed in as <strong>{user?.email ?? "—"}</strong>. You'll be asked for your current
        password to confirm.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">At least 8 characters, with letters and numbers.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {captcha.widget}
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update password
        </Button>
      </form>
    </Card>
    </div>
  );
}
