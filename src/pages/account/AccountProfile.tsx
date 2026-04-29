import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";

const AccountProfile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, company")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setCompany(data.company ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, company })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="bg-white border border-line p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-5">
        <UserIcon className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold uppercase tracking-wide text-sm">Profile</h2>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Email</Label>
          <Input value={user?.email ?? ""} disabled className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-display font-semibold uppercase tracking-wide">Company (optional)</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} className="mt-1.5" />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
};

export default AccountProfile;
