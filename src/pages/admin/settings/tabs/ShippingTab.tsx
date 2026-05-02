import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Truck } from "lucide-react";

export interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  price: number;
}

export interface ShippingSettings {
  methods: ShippingMethod[];
  free_threshold: number;
}

export const SHIPPING_DEFAULTS: ShippingSettings = {
  methods: [
    { id: "standard", label: "Standard Doorstep Delivery", eta: "3–5 business days", price: 0 },
    { id: "express", label: "Express Delivery", eta: "1–2 business days", price: 299 },
    { id: "installation", label: "Doorstep Installation + Old Battery Pickup", eta: "2–4 business days", price: 499 },
  ],
  free_threshold: 0,
};

const SETTING_KEY = "shipping_settings";

export function ShippingTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<ShippingSettings>(SETTING_KEY),
  });

  const [form, setForm] = useState<ShippingSettings>(SHIPPING_DEFAULTS);

  useEffect(() => {
    if (data) {
      setForm({
        methods: data.methods?.length ? data.methods : SHIPPING_DEFAULTS.methods,
        free_threshold: data.free_threshold ?? 0,
      });
    }
  }, [data]);

  const updateMethod = (idx: number, field: keyof ShippingMethod, val: string | number) => {
    setForm((prev) => ({
      ...prev,
      methods: prev.methods.map((m, i) => (i === idx ? { ...m, [field]: val } : m)),
    }));
  };

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("Shipping settings saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
      qc.invalidateQueries({ queryKey: ["shipping-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Shipping Cost Settings</h3>
        <p className="text-sm text-muted-foreground">Configure delivery methods, pricing, and free shipping threshold.</p>
      </div>

      {form.methods.map((method, idx) => (
        <Card key={method.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{method.label}</CardTitle>
            <CardDescription className="text-xs">ID: {method.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={method.label}
                  onChange={(e) => updateMethod(idx, "label", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ETA</Label>
                <Input
                  value={method.eta}
                  onChange={(e) => updateMethod(idx, "eta", e.target.value)}
                  placeholder="3–5 business days"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={method.price}
                  onChange={(e) => updateMethod(idx, "price", parseInt(e.target.value) || 0)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Free Shipping Threshold</CardTitle>
          <CardDescription className="text-xs">Orders above this amount get free standard shipping. Set to 0 to disable.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs">Minimum Order Value (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.free_threshold}
              onChange={(e) => setForm((prev) => ({ ...prev, free_threshold: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Shipping Settings
      </Button>
    </div>
  );
}
