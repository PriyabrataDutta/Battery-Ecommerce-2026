import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

interface AuthState {
  user: User | null;
  session: Session | null;
  isStaff: boolean;
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

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isStaff: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      const user = session?.user ?? null;

      if (!user) {
        cachedStaff = {};
        setState({ user: null, session: null, isStaff: false, loading: false });
        return;
      }

      // Session present → keep loading=true until staff RPC resolves.
      setState((s) => ({ ...s, user, session, loading: true }));

      // Defer RPC to next tick to avoid auth-deadlock inside onAuthStateChange.
      setTimeout(async () => {
        const staff = await checkStaff(user.id);
        if (cancelled) return;
        setState((s) =>
          // Only update if we're still on the same user (avoid races on quick sign-out).
          s.user?.id === user.id
            ? { ...s, isStaff: staff, loading: false }
            : s,
        );
      }, 0);
    };

    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    // THEN read existing session
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: fullName ? { full_name: fullName } : undefined,
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

  return { ...state, signIn, signUp, signInWithGoogle, resetPassword, signOut };
}
