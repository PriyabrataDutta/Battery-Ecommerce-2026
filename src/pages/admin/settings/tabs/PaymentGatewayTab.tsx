import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { pingCashfree } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, Save, Copy, PlugZap, Banknote } from "lucide-react";

type Mode = "test" | "live";

/** Non-secret config, stored in site_settings (staff-readable, not public). */
interface GatewayConfig {
  active_gateway: "cashfree";
  /** Show "Pay online" at checkout (also needs App ID + Secret for the active mode). */
  online_enabled: boolean;
  /** Show "Cash on Delivery" at checkout. */
  cod_enabled: boolean;
  mode: Mode;
  cashfree: Record<Mode, { app_id: string; secret_set: boolean }>;
}

const DEFAULTS: GatewayConfig = {
  active_gateway: "cashfree",
  online_enabled: false,
  cod_enabled: true,
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

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cashfree-webhook`;
  const pingMut = useMutation({
    mutationFn: pingCashfree,
    onSuccess: (r) =>
      r.ok
        ? toast.success(`Cashfree ${r.mode === "live" ? "production" : "sandbox"} keys work`)
        : toast.error(`Cashfree rejected the ${r.mode} keys: ${r.error}`),
    onError: (e: Error) => toast.error(e.message),
  });
  const activeReady = !!form.cashfree[form.mode].app_id && (form.cashfree[form.mode].secret_set || !!secrets[form.mode]);

  const setAppId = (m: Mode, app_id: string) =>
    setForm((prev) => ({ ...prev, cashfree: { ...prev.cashfree, [m]: { ...prev.cashfree[m], app_id } } }));

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Payment Gateway</h3>
          <p className="text-sm text-muted-foreground">Payment methods shown at checkout, and Cashfree credentials.</p>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Payment methods at checkout</CardTitle>
          <CardDescription className="text-xs">Changes apply to new orders as soon as you save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>
                <span className="font-medium">Pay online (Cashfree)</span>
                <span className="block text-xs text-muted-foreground">
                  UPI, cards, net banking. Needs the {form.mode === "live" ? "production" : "sandbox"} App ID and Secret Key below.
                </span>
              </span>
            </span>
            <Switch
              checked={form.online_enabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, online_enabled: v }))}
            />
          </label>
          {form.online_enabled && !activeReady && (
            <p className="text-xs text-destructive">
              Online payment stays hidden at checkout until the {form.mode === "live" ? "production" : "sandbox"} App ID and Secret Key are saved.
            </p>
          )}
          <label className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-sm">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="font-medium">Cash on Delivery</span>
            </span>
            <Switch
              checked={form.cod_enabled}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, cod_enabled: v }))}
            />
          </label>
          {!form.online_enabled && !form.cod_enabled && (
            <p className="text-xs text-destructive">With both off, customers cannot place orders.</p>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cashfree setup</CardTitle>
          <CardDescription className="text-xs">One-time steps in the Cashfree dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">Webhook URL — Developers → Webhooks → Payment (version 2023-08-01)</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="h-9 text-xs font-mono" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => navigator.clipboard.writeText(webhookUrl).then(() => toast.success("Webhook URL copied"))}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Also whitelist <span className="font-mono">www.kachibatteries.com</span> under Developers → Whitelisting, or production checkout will refuse to open.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => pingMut.mutate()} disabled={pingMut.isPending}>
            {pingMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <PlugZap className="h-3.5 w-3.5 mr-2" />}
            Test {form.mode === "live" ? "production" : "sandbox"} connection
          </Button>
          <p className="text-muted-foreground">Save first — the test uses the saved keys for the selected mode.</p>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  );
}
