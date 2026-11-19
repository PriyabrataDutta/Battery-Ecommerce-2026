import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/lib/functionError";
import { safeNext } from "@/lib/safeNext";

/** Supabase Auth messages → wording a customer can act on. */
function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Sign in, or use “Forgot password”.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("captcha")) return "Security check failed. Please complete it again.";
  if (m.includes("invalid login credentials")) return "Wrong email/mobile or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("database error saving new user")) return "We couldn't create your account right now. Please try again in a few minutes.";
  return msg;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isStaff: boolean;
  /** True if the customer has a phone on profile AND it's verified. Null while loading. */
  phoneVerified: boolean | null;
  /** True if the customer has a phone number on profile. Null while loading. */
  hasPhone: boolean | null;
  /** True until BOTH the session is restored AND (if there's a user) the staff RPC has resolved. */
  loading: boolean;
}

// Keyed by access token: staff access needs a 2FA (aal2) session, so the answer
// changes when the session is upgraded after the authenticator code.
let cachedStaff: Record<string, boolean> = {};

async function checkStaff(session: Session): Promise<boolean> {
  const key = session.access_token;
  if (cachedStaff[key] !== undefined) return cachedStaff[key];
  const { data, error } = await supabase.rpc("is_staff", { _user_id: session.user.id });
  if (error) return false;
  cachedStaff[key] = !!data;
  return !!data;
}

async function loadProfilePhoneState(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("phone, phone_verified")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return { hasPhone: false, phoneVerified: false };
  return {
    hasPhone: !!data.phone,
    phoneVerified: !!data.phone_verified,
  };
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signInWithIdentifier: (identifier: string, password: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string, phone?: string, captchaToken?: string, next?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string, captchaToken?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshPhoneState: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isStaff: false,
    phoneVerified: null,
    hasPhone: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      const user = session?.user ?? null;

      if (!user) {
        cachedStaff = {};
        setState({
          user: null,
          session: null,
          isStaff: false,
          phoneVerified: null,
          hasPhone: null,
          loading: false,
        });
        return;
      }

      setState((s) => ({ ...s, user, session, loading: true }));

      setTimeout(async () => {
        const [staff, phoneState] = await Promise.all([
          checkStaff(session),
          loadProfilePhoneState(user.id),
        ]);
        if (cancelled) return;
        setState((s) =>
          s.user?.id === user.id
            ? {
                ...s,
                isStaff: staff,
                hasPhone: phoneState.hasPhone,
                phoneVerified: phoneState.phoneVerified,
                loading: false,
              }
            : s,
        );
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  /**
   * Accepts either an email or a phone number. Phone sign-in runs entirely in
   * the phone-login edge function (so a mobile number never reveals an email);
   * it hands back session tokens.
   */
  const signInWithIdentifier = async (identifier: string, password: string, captchaToken?: string) => {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) return signIn(trimmed, password, captchaToken);

    const { data, error } = await supabase.functions.invoke("phone-login", {
      body: { phone: trimmed.replace(/[^\d+]/g, ""), password, captchaToken },
    });
    if (error) return { error: await functionErrorMessage(error, "Could not sign in with that mobile number.") };
    const { error: sessionError } = await supabase.auth.setSession(data);
    return { error: sessionError ? friendlyAuthError(sessionError.message) : null };
  };

  const signUp = async (email: string, password: string, fullName?: string, phone?: string, captchaToken?: string, next?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        // The confirmation link brings them back where they were shopping.
        emailRedirectTo: `${window.location.origin}${safeNext(next)}`,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(phone ? { phone } : {}),
        },
      },
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo ?? `${window.location.origin}/account` },
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  const resetPassword = async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken,
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  };

  const signOut = async () => {
    cachedStaff = {};
    await supabase.auth.signOut();
  };

  const refreshPhoneState = async () => {
    if (!state.user) return;
    const phoneState = await loadProfilePhoneState(state.user.id);
    setState((s) =>
      s.user?.id === state.user!.id
        ? { ...s, ...phoneState }
        : s,
    );
  };

  return {
    ...state,
    signIn,
    signInWithIdentifier,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
    refreshPhoneState,
  };
}
