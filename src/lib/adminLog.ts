import { supabase } from "@/integrations/supabase/client";

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  diff: Record<string, any> = {}
) {
  try {
    await supabase.rpc("admin_log", {
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId ?? null,
      _diff: diff,
    });
  } catch {
    /* best-effort logging */
  }
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}
