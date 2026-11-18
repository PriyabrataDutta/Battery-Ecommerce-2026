import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/lib/functionError";

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

let cachedStaff: Record<string, boolean> = {};

async function checkStaff(userId: string, force = false): Promise<boolean> {
  if (!force && cachedStaff[userId] !== undefined) return cachedStaff[userId];
  const { data, error } = await supabase.rpc("is_staff", { _user_id: userId });
  if (error) return false;
  cachedStaff[userId] = !!data;
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
  signUp: (email: string, password: string, fullName?: string, phone?: string, captchaToken?: string) => Promise<{ error: string | null }>;
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
          checkStaff(user.id),
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
   * Accepts either an email or a phone number. If it's a phone, resolve the
   * corresponding email through a secure edge function, then sign in normally.
   */
  const signInWithIdentifier = async (identifier: string, password: string, captchaToken?: string) => {
    const trimmed = identifier.trim();
    const looksLikeEmail = trimmed.includes("@");
    let email = trimmed;

    if (!looksLikeEmail) {
      // Normalise: keep digits and leading +.
      const normalised = trimmed.replace(/[^\d+]/g, "");
      const { data, error } = await supabase.functions.invoke("phone-login-lookup", {
        body: { phone: normalised },
      });
      if (error) return { error: await functionErrorMessage(error, "Could not sign in with that mobile number.") };
      if (!data?.email) return { error: "No account found for that mobile number." };
      email = data.email as string;
    }

    return signIn(email, password, captchaToken);
  };

  const signUp = async (email: string, password: string, fullName?: string, phone?: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        emailRedirectTo: `${window.location.origin}/account`,
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
