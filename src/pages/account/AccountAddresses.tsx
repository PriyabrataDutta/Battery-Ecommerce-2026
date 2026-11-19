import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useMyAddresses,
  useCreateAddress,
  useSetDefaultAddress,
  useDeleteAddress,
} from "@/hooks/queries/useAddresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";

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
  const { data: rows, isLoading } = useMyAddresses(user?.id);
  const createAddress = useCreateAddress();
  const setDefaultMut = useSetDefaultAddress();
  const deleteMut = useDeleteAddress();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!user) return;
    if (!form.full_name || !form.phone || !form.line1 || !form.city || !form.state || !/^[1-9][0-9]{5}$/.test(form.pincode)) {
      toast.error("Please fill all required fields including a valid 6-digit PIN.");
      return;
    }
    createAddress.mutate(
      {
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
        is_default: (rows?.length ?? 0) === 0,
      },
      {
        onSuccess: () => {
          toast.success("Address saved");
          setForm(empty);
          setAdding(false);
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
      },
    );
  };

  const setDefault = (id: string) => setDefaultMut.mutate(id);
  const remove = (id: string) => {
    if (!confirm("Delete this address?")) return;
    deleteMut.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="surface p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-display-tight text-xl font-bold">Saved addresses</h2>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="surface p-5 space-y-3">
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
            <Button onClick={save} disabled={createAddress.isPending}>
              {createAddress.isPending ? "Saving…" : "Save address"}
            </Button>
            <Button variant="outline" onClick={() => { setAdding(false); setForm(empty); }}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading || rows === undefined ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground surface p-6">No saved addresses yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((a) => (
            <div key={a.id} className="surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{a.label || "Address"}</span>
                {a.is_default && (
                  <span className="text-[11px] font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">Default</span>
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
    <Label className="text-sm font-medium">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export default AccountAddresses;
