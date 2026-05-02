import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Receipt } from "lucide-react";

export interface GstSettings {
  gst_rate: number;
  gstin: string;
  business_name: string;
  state: string;
  show_breakup: boolean;
}

export const GST_DEFAULTS: GstSettings = {
  gst_rate: 18,
  gstin: "",
  business_name: "",
  state: "",
  show_breakup: false,
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman & Nicobar", "Dadra & Nagar Haveli", "Daman & Diu", "Lakshadweep",
];

const SETTING_KEY = "gst_settings";

export function GstTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<GstSettings>(SETTING_KEY),
  });

  const [form, setForm] = useState<GstSettings>(GST_DEFAULTS);

  useEffect(() => {
    if (data) setForm({ ...GST_DEFAULTS, ...data });
  }, [data]);

  const update = <K extends keyof GstSettings>(key: K, val: GstSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("GST settings saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
      qc.invalidateQueries({ queryKey: ["gst-settings"] }); // Invalidate frontend cache
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> GST Settings</h3>
        <p className="text-sm text-muted-foreground">Configure GST rate and business tax details.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tax Configuration</CardTitle>
          <CardDescription className="text-xs">This GST rate is applied to all orders at checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">GST Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.gst_rate}
                onChange={(e) => update("gst_rate", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business GSTIN</Label>
              <Input
                value={form.gstin}
                onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className="h-9 text-sm font-mono"
                maxLength={15}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Business Legal Name</Label>
              <Input
                value={form.business_name}
                onChange={(e) => update("business_name", e.target.value)}
                placeholder="Kachi Batteries Pvt. Ltd."
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business State</Label>
              <Select value={form.state} onValueChange={(v) => update("state", v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <Switch
              id="gst-breakup"
              checked={form.show_breakup}
              onCheckedChange={(v) => update("show_breakup", v)}
            />
            <Label htmlFor="gst-breakup" className="text-sm cursor-pointer">
              Show CGST/SGST breakup on invoices (instead of single GST line)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
        {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save GST Settings
      </Button>
    </div>
  );
}
