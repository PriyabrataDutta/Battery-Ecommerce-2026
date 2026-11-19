import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { safeNext } from "@/lib/safeNext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { functionErrorMessage } from "@/lib/functionError";

const RESEND_COOLDOWN = 60;

const VerifyPhone = () => {
  const { user, hasPhone, phoneVerified, loading, refreshPhoneState } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const sentOnce = useRef(false);

  // Auto-send the first code as soon as we know the user has a phone.
  useEffect(() => {
    if (loading) return;
    if (!user || !hasPhone) return;
    if (phoneVerified) return;
    if (sentOnce.current) return;
    sentOnce.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, hasPhone, phoneVerified]);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!loading && !user) return <Navigate to={`/auth?next=${encodeURIComponent(`/verify-phone?next=${next}`)}`} replace />;
  if (!loading && user && !hasPhone) return <Navigate to={`/add-phone?next=${encodeURIComponent(next)}`} replace />;
  if (!loading && phoneVerified) return <Navigate to={next} replace />;

  const sendCode = async () => {
    setSending(true);
    setDevCode(null);
    const { data, error } = await supabase.functions.invoke("send-phone-verification-code", {
      body: {},
    });
    setSending(false);
    if (error) {
      toast.error(await functionErrorMessage(error, "Could not send code. Try again."));
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    if (data?.delivery === "dev_log" && data?.dev_code) {
      setDevCode(data.dev_code);
      toast.message("Email delivery isn't set up yet — using on-screen code.");
    } else {
      toast.success("We sent a 4-digit code to your email.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4) {
      toast.error("Enter the 4-digit code.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc("verify_phone_code", { _code: code });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data === true) {
      toast.success("Mobile number verified.");
      await refreshPhoneState();
      navigate(next, { replace: true });
    } else {
      toast.error("Wrong code. Please try again.");
      setCode("");
    }
  };

  return (
    <div className="container-x max-w-md py-12 sm:py-20">
      <div className="text-center"><span className="eyebrow">Account</span></div>
      <h1 className="mt-2 font-display-tight text-3xl sm:text-4xl font-bold text-center">Verify your mobile</h1>
      <p className="text-center text-muted-foreground mt-2">
        Enter the 4-digit code we sent to your email.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 surface p-6 sm:p-8 space-y-4">
        <Input
          inputMode="numeric"
          autoFocus
          maxLength={4}
          pattern="\d{4}"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          className="text-center text-2xl tracking-[0.5em] font-mono"
        />

        {devCode && (
          <div className="text-center text-sm rounded-xl border border-dashed border-line bg-muted/40 px-3 py-2">
            <div className="text-muted-foreground text-xs uppercase tracking-wider">Dev code</div>
            <div className="font-mono text-lg">{devCode}</div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy || code.length !== 4}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Verify
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={sendCode}
          disabled={sending || cooldown > 0}
        >
          {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </Button>
      </form>
    </div>
  );
};

export default VerifyPhone;
