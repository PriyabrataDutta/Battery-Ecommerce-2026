import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { safeNext } from "@/lib/safeNext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { INVALID_MOBILE, normalizeIndianMobile } from "@/lib/phone";
import { Seo } from "@/components/Seo";


const AddPhone = () => {
  const { user, hasPhone, loading, refreshPhoneState } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !user) return <Navigate to={`/auth?next=${encodeURIComponent(`/add-phone?next=${next}`)}`} replace />;
  if (!loading && hasPhone) return <Navigate to={`/verify-phone?next=${encodeURIComponent(next)}`} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalised = normalizeIndianMobile(phone);
    if (!normalised) {
      toast.error(INVALID_MOBILE);
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: normalised })
      .eq("id", user!.id);
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("This mobile number is already linked to another account.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    await refreshPhoneState();
    navigate(`/verify-phone?next=${encodeURIComponent(next)}`, { replace: true });
  };

  return (
    <div className="container-x max-w-md py-12 sm:py-20">
      <Seo title="Add Phone Number" description="Add Phone Number at Kachi Batteries." noindex />
      <div className="text-center"><span className="eyebrow">Account</span></div>
      <h1 className="mt-2 font-display-tight text-3xl sm:text-4xl font-bold text-center">Add your mobile</h1>
      <p className="text-center text-muted-foreground mt-2">
        We need your mobile number to confirm orders and send delivery updates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 surface p-6 sm:p-8 space-y-4">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoFocus
          placeholder="98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continue
        </Button>
      </form>
    </div>
  );
};

export default AddPhone;
