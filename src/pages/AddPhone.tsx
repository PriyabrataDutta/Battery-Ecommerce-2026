import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{10,15}$/, "Enter a valid mobile number (10-15 digits)");

const AddPhone = () => {
  const { user, hasPhone, loading, refreshPhoneState } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/account";
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && !user) return <Navigate to={`/auth?next=${encodeURIComponent(`/add-phone?next=${next}`)}`} replace />;
  if (!loading && hasPhone) return <Navigate to={`/verify-phone?next=${encodeURIComponent(next)}`} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Default to +91 if no country code typed
    const normalised = phone.trim().startsWith("+") ? phone.trim() : `+91${phone.trim().replace(/\D/g, "")}`;
    const parsed = phoneSchema.safeParse(normalised);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ phone: parsed.data })
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
    <div className="container-x py-12 max-w-md">
      <h1 className="font-display-tight text-4xl font-bold text-center">Add your mobile</h1>
      <p className="text-center text-muted-foreground mt-2">
        We need your mobile number to confirm orders and send delivery updates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 bg-white border border-line p-6 space-y-4">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoFocus
          placeholder="+91 98xxx xxxxx"
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
