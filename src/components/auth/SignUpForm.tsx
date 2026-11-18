/**
 * Sign-up form with per-field validation, a honeypot field and the Turnstile
 * security check. Server-side protection: Supabase Auth (per-IP rate limits,
 * CAPTCHA verification once enabled) and the sign-up circuit breaker trigger.
 */
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCaptcha } from "./Captcha";
import { signUpSchema } from "./signUpSchema";

type Field = "fullName" | "phone" | "email" | "password" | "confirmPassword";
type Values = Record<Field, string>;
const EMPTY: Values = { fullName: "", phone: "", email: "", password: "", confirmPassword: "" };

export const SignUpForm = () => {
  const { signUp } = useAuth();
  const captcha = useCaptcha();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState(false);

  const validate = (v: Values) => {
    const r = signUpSchema.safeParse(v);
    if (r.success) return { ok: r.data, errs: {} as Partial<Record<Field, string>> };
    const errs: Partial<Record<Field, string>> = {};
    for (const issue of r.error.issues) {
      const f = issue.path[0] as Field;
      errs[f] ??= issue.message;
    }
    return { ok: null, errs };
  };

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...values, [f]: e.target.value };
    setValues(next);
    // Re-validate fields the user has already left, so errors clear as they fix them.
    if (touched[f] || errors[f]) setErrors(validate(next).errs);
  };
  const blur = (f: Field) => () => {
    setTouched((t) => ({ ...t, [f]: true }));
    const { errs } = validate(values);
    setErrors((prev) => ({ ...prev, [f]: errs[f] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { ok, errs } = validate(values);
    setErrors(errs);
    setTouched({ fullName: true, phone: true, email: true, password: true, confirmPassword: true });
    if (!ok) return;
    // Honeypot: real people never see this field; bots that fill it get a fake success.
    if (honeypot) return setDone(true);
    if (!captcha.ready) return toast.error("Please complete the security check.");

    setBusy(true);
    const { error } = await signUp(ok.email, ok.password, ok.fullName, ok.phone, captcha.token);
    setBusy(false);
    captcha.reset();
    if (error) return toast.error(error);
    setDone(true);
  };

  if (done) {
    return (
      <div className="mt-4 text-sm space-y-2">
        <p className="font-semibold">Check your email</p>
        <p className="text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-ink">{values.email.trim().toLowerCase()}</span>.
          Open it to activate your account, then sign in and verify your mobile number.
        </p>
      </div>
    );
  }

  const fieldError = (f: Field) =>
    errors[f] ? (
      <p id={`su-${f}-err`} className="text-xs text-destructive mt-1">
        {errors[f]}
      </p>
    ) : null;
  const aria = (f: Field) => ({ "aria-invalid": !!errors[f], "aria-describedby": errors[f] ? `su-${f}-err` : undefined });

  return (
    <form onSubmit={submit} className="space-y-3 mt-4" noValidate>
      <div>
        <Input placeholder="Full name" autoComplete="name" maxLength={80} value={values.fullName}
          onChange={set("fullName")} onBlur={blur("fullName")} {...aria("fullName")} />
        {fieldError("fullName")}
      </div>
      <div>
        <Input type="tel" inputMode="tel" placeholder="Mobile number (e.g. 98765 43210)" autoComplete="tel" maxLength={20}
          value={values.phone} onChange={set("phone")} onBlur={blur("phone")} {...aria("phone")} />
        {fieldError("phone")}
      </div>
      <div>
        <Input type="email" placeholder="Email" autoComplete="email" maxLength={255} value={values.email}
          onChange={set("email")} onBlur={blur("email")} {...aria("email")} />
        {fieldError("email")}
      </div>
      <div>
        <div className="relative">
          <Input type={showPw ? "text" : "password"} placeholder="Password (8+ characters, letters and numbers)"
            autoComplete="new-password" maxLength={72} value={values.password} className="pr-10"
            onChange={set("password")} onBlur={blur("password")} {...aria("password")} />
          <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-ink">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldError("password")}
      </div>
      <div>
        <Input type={showPw ? "text" : "password"} placeholder="Confirm password" autoComplete="new-password" maxLength={72}
          value={values.confirmPassword} onChange={set("confirmPassword")} onBlur={blur("confirmPassword")}
          {...aria("confirmPassword")} />
        {fieldError("confirmPassword")}
      </div>

      {/* Honeypot — hidden from people and screen readers. */}
      <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }} />

      {captcha.widget}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
};
