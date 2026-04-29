import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";

interface AddressRow {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
  is_default: boolean;
}

const empty = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
};

const AccountAddresses = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AddressRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });
    setRows((data ?? []) as AddressRow[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.full_name || !form.phone || !form.line1 || !form.city || !form.state || !/^[1-9][0-9]{5}$/.test(form.pincode)) {
      toast.error("Please fill all required fields including a valid 6-digit PIN.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("customer_addresses").insert({
      user_id: user.id,
      label: form.label || null,
      full_name: form.full_name,
      phone: form.phone,
      line1: form.line1,
      line2: form.line2 || null,
      landmark: form.landmark || null,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      gstin: form.gstin || null,
      is_default: rows?.length === 0,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Address saved");
    setForm(empty);
    setAdding(false);
    load();
  };

  const setDefault = async (id: string) => {
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await supabase.from("customer_addresses").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-line p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold uppercase tracking-wide text-sm">Saved addresses</h2>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="bg-white border border-line p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Label"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home / Office" /></Field>
            <Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
            <Field label="Phone *"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} /></Field>
            <Field label="PIN code *"><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></Field>
            <Field label="Address line 1 *" className="sm:col-span-2"><Input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></Field>
            <Field label="Address line 2" className="sm:col-span-2"><Input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></Field>
            <Field label="Landmark" className="sm:col-span-2"><Textarea rows={2} value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} /></Field>
            <Field label="City *"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="State *"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
            <Field label="GSTIN" className="sm:col-span-2"><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase().slice(0, 15) })} /></Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save address"}</Button>
            <Button variant="outline" onClick={() => { setAdding(false); setForm(empty); }}>Cancel</Button>
          </div>
        </div>
      )}

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground bg-white border border-line p-6">No saved addresses yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((a) => (
            <div key={a.id} className="bg-white border border-line p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-display font-bold uppercase tracking-wide">{a.label || "Address"}</span>
                {a.is_default && (
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5">Default</span>
                )}
              </div>
              <div className="text-sm">
                <div className="font-semibold">{a.full_name}</div>
                <div className="text-muted-foreground">{a.phone}</div>
                <div className="mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
                {a.landmark && <div className="text-xs text-muted-foreground">Landmark: {a.landmark}</div>}
                <div>{a.city}, {a.state} – {a.pincode}</div>
                {a.gstin && <div className="text-xs font-mono mt-1">GSTIN: {a.gstin}</div>}
              </div>
              <div className="mt-3 flex gap-2">
                {!a.is_default && (
                  <Button size="sm" variant="outline" onClick={() => setDefault(a.id)}>
                    <Star className="h-3 w-3 mr-1" /> Set default
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(a.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <Label className="text-xs font-display font-semibold uppercase tracking-wide">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export default AccountAddresses;
