import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isStaff: boolean;
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
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isStaff: false,
    loading: true,
  });

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }));
      if (session?.user) {
        // Defer staff RPC to next tick to avoid auth deadlocks
        setTimeout(async () => {
          const staff = await checkStaff(session.user.id);
          setState((s) => ({ ...s, isStaff: staff }));
        }, 0);
      } else {
        cachedStaff = {};
        setState((s) => ({ ...s, isStaff: false }));
      }
    });

    // THEN read existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }));
      if (session?.user) {
        checkStaff(session.user.id).then((staff) =>
          setState((s) => ({ ...s, isStaff: staff }))
        );
      }
    });

    return () => sub.subscription.unsubscribe();
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
        emailRedirectTo: `${window.location.origin}/`,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    cachedStaff = {};
    await supabase.auth.signOut();
  };

  return { ...state, signIn, signUp, signOut };
}
