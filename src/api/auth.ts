import { supabase } from "./client";

/**
 * Auth surface — wraps the Supabase auth client so the rest of the app never
 * imports it directly. When you swap providers later, you only edit this file.
 */

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: Record<string, unknown>,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 */
export function onAuthStateChange(cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  const { data } = supabase.auth.onAuthStateChange(cb);
  return () => data.subscription.unsubscribe();
}
