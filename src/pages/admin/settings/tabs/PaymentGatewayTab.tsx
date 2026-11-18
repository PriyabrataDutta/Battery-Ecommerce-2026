import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, Save } from "lucide-react";

type Mode = "test" | "live";

/** Non-secret config, stored in site_settings (staff-readable, not public). */
interface GatewayConfig {
  active_gateway: "cashfree";
  mode: Mode;
  cashfree: Record<Mode, { app_id: string; secret_set: boolean }>;
}

const DEFAULTS: GatewayConfig = {
  active_gateway: "cashfree",
  mode: "test",
  cashfree: {
    test: { app_id: "", secret_set: false },
    live: { app_id: "", secret_set: false },
  },
};

const SETTING_KEY = "payment_gateway";

export function PaymentGatewayTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<GatewayConfig>(SETTING_KEY),
  });

  const [form, setForm] = useState<GatewayConfig>(DEFAULTS);
  // Secrets are write-only: typed here, sent to private_settings, never read back.
  const [secrets, setSecrets] = useState<Record<Mode, string>>({ test: "", live: "" });

  useEffect(() => {
    if (data?.cashfree?.test) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const toSave: GatewayConfig = structuredClone(form);
      const secretPatch: Record<string, string> = {};
      (["test", "live"] as Mode[]).forEach((m) => {
        if (secrets[m]) {
          secretPatch[`cashfree_${m}_secret`] = secrets[m];
          toSave.cashfree[m].secret_set = true;
        }
      });
      if (Object.keys(secretPatch).length) {
        const { error } = await supabase.rpc("admin_set_private_setting", { _key: "payment_secrets", _value: secretPatch });
        if (error) throw error;
      }
      await setSetting(SETTING_KEY, toSave);
    },
    onSuccess: () => {
      toast.success("Payment gateway settings saved");
      setSecrets({ test: "", live: "" });
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setAppId = (m: Mode, app_id: string) =>
    setForm((prev) => ({ ...prev, cashfree: { ...prev.cashfree, [m]: { ...prev.cashfree[m], app_id } } }));

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Payment Gateway</h3>
          <p className="text-sm text-muted-foreground">Cashfree for online payments. Cash on Delivery is always available.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-toggle" className="text-sm">Test</Label>
            <Switch
              id="mode-toggle"
              checked={form.mode === "live"}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, mode: v ? "live" : "test" }))}
            />
            <Label htmlFor="mode-toggle" className="text-sm">Live</Label>
          </div>
          <Badge variant={form.mode === "live" ? "destructive" : "secondary"}>
            {form.mode === "live" ? "LIVE" : "TEST"}
          </Badge>
        </div>
      </div>

      {(["test", "live"] as Mode[]).map((m) => (
        <Card key={m} className={form.mode === m ? "border-primary ring-1 ring-primary/30" : undefined}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Cashfree {m === "test" ? "Sandbox" : "Production"} Credentials
              {form.mode === m && <Badge variant="default" className="text-[10px] ml-auto">In use</Badge>}
            </CardTitle>
            <CardDescription className="text-xs">
              From the Cashfree dashboard → Developers → API Keys ({m === "test" ? "sandbox" : "production"}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">App ID</Label>
              <Input value={form.cashfree[m].app_id} onChange={(e) => setAppId(m, e.target.value)} className="h-9 text-sm font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Secret Key {form.cashfree[m].secret_set && <span className="text-muted-foreground">(already set — leave blank to keep)</span>}
              </Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={secrets[m]}
                onChange={(e) => setSecrets((prev) => ({ ...prev, [m]: e.target.value }))}
                placeholder={form.cashfree[m].secret_set ? "••••••••" : "Enter secret key"}
                className="h-9 text-sm font-mono"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  );
}
