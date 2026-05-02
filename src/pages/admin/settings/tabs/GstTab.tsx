import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSetting, setSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Receipt, Plus, Trash2, Star } from "lucide-react";
import type { GstRate } from "@/hooks/useGstSettings";

/* ── Business details (stored in site_settings) ── */

interface BusinessGstSettings {
  gstin: string;
  business_name: string;
  state: string;
  show_breakup: boolean;
}

const BIZ_DEFAULTS: BusinessGstSettings = {
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> GST Settings
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage GST rate slabs and business tax details.
        </p>
      </div>
      <GstRatesSection />
      <BusinessDetailsSection />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GST Rates CRUD
   ═══════════════════════════════════════════════════════════════════ */

function GstRatesSection() {
  const qc = useQueryClient();
  const { data: rates, isLoading } = useQuery<GstRate[]>({
    queryKey: ["gst-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gst_rates")
        .select("id, label, rate, hsn_code, is_default")
        .order("rate");
      if (error) throw error;
      return (data ?? []) as GstRate[];
    },
  });

  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newHsn, setNewHsn] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gst-rates"] });

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gst_rates").insert({
        label: newLabel.trim() || `GST ${newRate}%`,
        rate: parseFloat(newRate) || 0,
        hsn_code: newHsn.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("GST rate added");
      setAdding(false);
      setNewLabel("");
      setNewRate("");
      setNewHsn("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gst_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("GST rate deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setDefaultMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("gst_rates")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Default GST rate updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">GST Rate Slabs</CardTitle>
        <CardDescription className="text-xs">
          Create multiple GST rates and assign them to products. The default rate is used when a product has no specific rate assigned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing rates */}
        <div className="border rounded-md divide-y">
          {(rates ?? []).map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="font-medium min-w-[100px]">{r.label}</span>
              <span className="text-muted-foreground">{r.rate}%</span>
              {r.hsn_code && (
                <span className="text-xs text-muted-foreground font-mono">HSN: {r.hsn_code}</span>
              )}
              <div className="ml-auto flex items-center gap-1">
                {r.is_default ? (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" /> Default
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDefaultMut.mutate(r.id)}
                    disabled={setDefaultMut.isPending}
                  >
                    Set default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMut.mutate(r.id)}
                  disabled={deleteMut.isPending || r.is_default}
                  title={r.is_default ? "Cannot delete the default rate" : "Delete"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {(!rates || rates.length === 0) && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No GST rates configured yet.
            </div>
          )}
        </div>

        {/* Add new rate */}
        {adding ? (
          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. GST 12%"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="18"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HSN Code</Label>
                <Input
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="Optional"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending || !newRate}>
                {addMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Add Rate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add GST Rate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Business Details
   ═══════════════════════════════════════════════════════════════════ */

function BusinessDetailsSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-setting", SETTING_KEY],
    queryFn: () => getSetting<BusinessGstSettings>(SETTING_KEY),
  });

  const [form, setForm] = useState<BusinessGstSettings>(BIZ_DEFAULTS);

  useEffect(() => {
    if (data) setForm({ ...BIZ_DEFAULTS, ...data });
  }, [data]);

  const update = <K extends keyof BusinessGstSettings>(key: K, val: BusinessGstSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const saveMut = useMutation({
    mutationFn: () => setSetting(SETTING_KEY, form),
    onSuccess: () => {
      toast.success("Business GST details saved");
      qc.invalidateQueries({ queryKey: ["site-setting", SETTING_KEY] });
      qc.invalidateQueries({ queryKey: ["gst-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Business Tax Details</CardTitle>
        <CardDescription className="text-xs">Your business GSTIN and legal details for invoices.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="space-y-1">
            <Label className="text-xs">Business Legal Name</Label>
            <Input
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              placeholder="Kachi Batteries Pvt. Ltd."
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            Show CGST/SGST breakup on invoices
          </Label>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="w-full sm:w-auto">
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Business Details
        </Button>
      </CardContent>
    </Card>
  );
}
