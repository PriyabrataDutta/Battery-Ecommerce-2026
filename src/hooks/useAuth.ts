import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithIdentifier: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  /**
   * Accepts either an email or a phone number. If it's a phone, resolve the
   * corresponding email through a secure edge function, then sign in normally.
   */
  const signInWithIdentifier = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const looksLikeEmail = trimmed.includes("@");
    let email = trimmed;

    if (!looksLikeEmail) {
      // Normalise: keep digits and leading +.
      const normalised = trimmed.replace(/[^\d+]/g, "");
      const { data, error } = await supabase.functions.invoke("phone-login-lookup", {
        body: { phone: normalised },
      });
      if (error) return { error: "Could not sign in with that mobile number." };
      if (!data?.email) return { error: "No account found for that mobile number." };
      email = data.email as string;
    }

    return signIn(email, password);
  };


  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(phone ? { phone } : {}),
        },
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo ?? `${window.location.origin}/account`,
      });
      if (result.error) {
        const msg = result.error instanceof Error ? result.error.message : String(result.error);
        return { error: msg };
      }
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Google sign-in failed" };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
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
