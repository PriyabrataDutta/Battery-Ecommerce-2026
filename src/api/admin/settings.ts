import { supabase } from "../client";
import { logActivity } from "@/lib/adminLog";

/**
 * Admin Settings API
 * --------------------------------------------------------------
 * CRUD for the `site_settings` key/value table.
 */

export interface SiteSettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export async function listSettings(): Promise<SiteSettingRow[]> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_at")
    .order("key");
  if (error) throw error;
  return (data ?? []) as SiteSettingRow[];
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
  await logActivity("setting.upsert", "site_setting", key, {});
}

export async function deleteSetting(key: string): Promise<void> {
  const { error } = await supabase.from("site_settings").delete().eq("key", key);
  if (error) throw error;
  await logActivity("setting.delete", "site_setting", key, {});
}
