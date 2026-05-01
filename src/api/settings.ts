import { supabase } from "./client";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value ?? null) as T | null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
}
