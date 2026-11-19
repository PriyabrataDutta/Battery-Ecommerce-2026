import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { TotpQr } from "@/components/auth/TotpQr";

/**
 * Settings → Security: the signed-in admin's own two-factor status, and moving
 * it to a new phone (the new authenticator is verified before the old one is removed).
 * 2FA itself stays mandatory for admin/staff — there is no "off".
 */
export function TwoFactorCard() {
  const qc = useQueryClient();
  const { data: factors, isLoading } = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const active = factors?.totp ?? [];

  const start = async () => {
    setBusy(true);
    // Clear half-finished setups first so names don't clash.
    for (const f of factors?.all.filter((f) => f.status === "unverified") ?? []) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Kachi Admin ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
      issuer: "Kachi Batteries",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSetup({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const cancel = async () => {
    if (setup) await supabase.auth.mfa.unenroll({ factorId: setup.factorId });
    setSetup(null);
    setCode("");
    qc.invalidateQueries({ queryKey: ["mfa-factors"] });
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: setup.factorId, code });
    if (error) {
      setBusy(false);
      setCode("");
      return toast.error("That code didn't match. Check the time on your phone and try the newest code.");
    }
    // New phone works → remove the old authenticator(s).
    for (const f of active) await supabase.auth.mfa.unenroll({ factorId: f.id });
    setBusy(false);
    setSetup(null);
    setCode("");
    qc.invalidateQueries({ queryKey: ["mfa-factors"] });
    toast.success("Authenticator updated", { description: "Use the new app for codes from now on." });
  };

  return (
    <Card className="p-6 max-w-lg">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display font-bold text-lg">Two-factor authentication</h2>
        </div>
        {!isLoading && (
          <Badge variant={active.length ? "default" : "destructive"}>{active.length ? "On" : "Not set up"}</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Admin sign-in needs your password <strong>and</strong> a 6-digit code from your authenticator app. This is
        required for all admin and staff accounts.
      </p>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : setup ? (
        <form onSubmit={confirm} className="space-y-4">
          <TotpQr qr={setup.qr} secret={setup.secret} />
          <div className="space-y-1.5">
            <Label htmlFor="new-mfa-code">Code from the new app</Label>
            <Input
              id="new-mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center tracking-[0.4em] text-lg"
            />
            <p className="text-xs text-muted-foreground">Your old authenticator keeps working until this succeeds.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify & switch
            </Button>
            <Button type="button" variant="ghost" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {active.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-md border border-line p-3 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Authenticator app</div>
                <div className="text-xs text-muted-foreground">Added {format(new Date(f.created_at), "dd MMM yyyy, HH:mm")}</div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={start} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {active.length ? "Move to a new phone" : "Set up authenticator"}
          </Button>
        </div>
      )}
    </Card>
  );
}
