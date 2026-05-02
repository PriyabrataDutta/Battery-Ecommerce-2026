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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Save, Receipt, Plus, Trash2, Star, Pencil, Check, X, ShieldCheck } from "lucide-react";
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

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editHsn, setEditHsn] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<GstRate | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gst-rates"] });

  /** Check if a rate % already exists (excluding a given id for edits) */
  const isDuplicate = (rateVal: number, excludeId?: string) =>
    (rates ?? []).some((r) => r.rate === rateVal && r.id !== excludeId);

  /** Whether HSN is required for a given rate */
  const hsnRequired = (rateVal: number) => rateVal >= 18;

  const addMut = useMutation({
    mutationFn: async () => {
      const rateNum = parseFloat(newRate) || 0;
      if (isDuplicate(rateNum)) throw new Error(`A slab with ${rateNum}% already exists.`);
      if (hsnRequired(rateNum) && !newHsn.trim()) throw new Error(`HSN code is required for rates ≥ 18%.`);
      const { error } = await supabase.from("gst_rates").insert({
        label: newLabel.trim() || `GST ${rateNum}%`,
        rate: rateNum,
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

  const updateMut = useMutation({
    mutationFn: async ({ id, label, rate, hsn_code }: { id: string; label: string; rate: number; hsn_code: string | null }) => {
      if (isDuplicate(rate, id)) throw new Error(`A slab with ${rate}% already exists.`);
      const { error } = await supabase.from("gst_rates").update({ label, rate, hsn_code }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("GST rate updated");
      setEditingId(null);
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
      setDeleteTarget(null);
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

  const startEdit = (r: GstRate) => {
    setEditingId(r.id);
    setEditLabel(r.label);
    setEditRate(String(r.rate));
    setEditHsn(r.hsn_code ?? "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    const rateNum = parseFloat(editRate) || 0;
    updateMut.mutate({
      id,
      label: editLabel.trim() || `GST ${rateNum}%`,
      rate: rateNum,
      hsn_code: editHsn.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const defaultRate = (rates ?? []).find((r) => r.is_default);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">GST Rate Slabs</CardTitle>
          <CardDescription className="text-xs">
            Create multiple GST rates and assign them to products. The default rate is used when a product has no specific rate assigned.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Default rate callout */}
          {defaultRate && (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">
                Default rate: <strong className="text-primary">{defaultRate.label} ({defaultRate.rate}%)</strong>
                <span className="text-muted-foreground"> — applied to products without a specific rate</span>
              </span>
            </div>
          )}

          {/* Existing rates */}
          <div className="border rounded-md divide-y">
            {(rates ?? []).map((r) => (
              <div key={r.id}>
                {editingId === r.id ? (
                  /* ── Inline edit row ── */
                  <div className="px-3 py-2 bg-muted/30 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Label</Label>
                        <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-7 text-sm" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Rate (%)</Label>
                        <Input type="number" min={0} max={100} step={0.5} value={editRate} onChange={(e) => setEditRate(e.target.value)} className="h-7 text-sm" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">HSN Code</Label>
                        <Input value={editHsn} onChange={(e) => setEditHsn(e.target.value)} placeholder="Optional" className="h-7 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => saveEdit(r.id)} disabled={updateMut.isPending || !editRate}>
                        {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={cancelEdit}>
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <div className={`flex items-center gap-3 px-3 py-2.5 text-sm ${r.is_default ? "bg-primary/[0.03]" : ""}`}>
                    <span className="font-medium min-w-[100px]">{r.label}</span>
                    <span className="text-muted-foreground">{r.rate}%</span>
                    {r.hsn_code && (
                      <span className="text-xs text-muted-foreground font-mono">HSN: {r.hsn_code}</span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      {r.is_default ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-primary/20">
                          <Star className="h-3 w-3 fill-primary" /> Default
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
                        className="h-7 w-7"
                        onClick={() => startEdit(r)}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(r)}
                        disabled={r.is_default}
                        title={r.is_default ? "Cannot delete the default rate" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
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
              {/* Duplicate warning */}
              {newRate && isDuplicate(parseFloat(newRate) || 0) && (
                <p className="text-xs text-destructive">A slab with {newRate}% already exists.</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addMut.mutate()}
                  disabled={addMut.isPending || !newRate || isDuplicate(parseFloat(newRate) || 0)}
                >
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GST rate?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.label}</strong> ({deleteTarget?.rate}%)?
              Products currently using this rate will fall back to the default rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
