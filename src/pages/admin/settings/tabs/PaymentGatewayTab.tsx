import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, Save } from "lucide-react";

type GatewayId = "razorpay" | "payu" | "cashfree";

interface GatewayConfig {
  active_gateway: GatewayId | null;
  mode: "test" | "live";
  razorpay: { key_id: string; key_secret: string };
  payu: { merchant_key: string; merchant_salt: string; merchant_id: string };
  cashfree: { app_id: string; secret_key: string };
}

const DEFAULTS: GatewayConfig = {
  active_gateway: null,
  mode: "test",
  razorpay: { key_id: "", key_secret: "" },
  payu: { merchant_key: "", merchant_salt: "", merchant_id: "" },
  cashfree: { app_id: "", secret_key: "" },
};

const GATEWAYS: { id: GatewayId; label: string; description: string }[] = [
  { id: "razorpay", label: "Razorpay", description: "UPI, Cards, Net Banking, Wallets" },
  { id: "payu", label: "PayU", description: "UPI, Cards, EMI, Net Banking" },
  { id: "cashfree", label: "Cashfree", description: "UPI, Cards, Pay Later, Net Banking" },
];

const SETTING_KEY = "payment_gateway";

export function PaymentGatewayTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<GatewayConfig>(SETTING_KEY),
  });

  const [form, setForm] = useState<GatewayConfig>(DEFAULTS);

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("Payment gateway settings saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = <K extends keyof GatewayConfig>(key: K, val: GatewayConfig[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const updateNested = (gw: GatewayId, field: string, val: string) =>
    setForm((prev) => ({ ...prev, [gw]: { ...(prev[gw] as Record<string, string>), [field]: val } }));

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Payment Gateway</h3>
          <p className="text-sm text-muted-foreground">Choose a payment gateway and enter credentials.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-toggle" className="text-sm">Test</Label>
            <Switch
              id="mode-toggle"
              checked={form.mode === "live"}
              onCheckedChange={(v) => update("mode", v ? "live" : "test")}
            />
            <Label htmlFor="mode-toggle" className="text-sm">Live</Label>
          </div>
          <Badge variant={form.mode === "live" ? "destructive" : "secondary"}>
            {form.mode === "live" ? "LIVE" : "TEST"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GATEWAYS.map((gw) => (
          <button
            key={gw.id}
            type="button"
            onClick={() => update("active_gateway", gw.id)}
            className={`text-left border rounded-lg p-4 transition-colors ${
              form.active_gateway === gw.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-line hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{gw.label}</span>
              {form.active_gateway === gw.id && <Badge variant="default" className="text-[10px] ml-auto">Active</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{gw.description}</p>
          </button>
        ))}
      </div>

      {form.active_gateway && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {GATEWAYS.find((g) => g.id === form.active_gateway)?.label} Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your {form.mode} mode API credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.active_gateway === "razorpay" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Key ID</Label>
                  <Input value={form.razorpay.key_id} onChange={(e) => updateNested("razorpay", "key_id", e.target.value)} placeholder="rzp_test_..." className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Key Secret</Label>
                  <Input type="password" value={form.razorpay.key_secret} onChange={(e) => updateNested("razorpay", "key_secret", e.target.value)} placeholder="••••••••" className="h-9 text-sm font-mono" />
                </div>
              </>
            )}
            {form.active_gateway === "payu" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Merchant Key</Label>
                  <Input value={form.payu.merchant_key} onChange={(e) => updateNested("payu", "merchant_key", e.target.value)} className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Merchant Salt</Label>
                  <Input type="password" value={form.payu.merchant_salt} onChange={(e) => updateNested("payu", "merchant_salt", e.target.value)} className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Merchant ID</Label>
                  <Input value={form.payu.merchant_id} onChange={(e) => updateNested("payu", "merchant_id", e.target.value)} className="h-9 text-sm font-mono" />
                </div>
              </>
            )}
            {form.active_gateway === "cashfree" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">App ID</Label>
                  <Input value={form.cashfree.app_id} onChange={(e) => updateNested("cashfree", "app_id", e.target.value)} className="h-9 text-sm font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Secret Key</Label>
                  <Input type="password" value={form.cashfree.secret_key} onChange={(e) => updateNested("cashfree", "secret_key", e.target.value)} className="h-9 text-sm font-mono" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  );
}
