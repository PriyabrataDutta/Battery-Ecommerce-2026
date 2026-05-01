import { supabase } from "../client";

export interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: Record<string, unknown>;
  created_at: string;
}

export async function listActivityLog(limit = 200): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ActivityLogRow[];
}

export async function logAdminAction(input: {
  action: string;
  entity_type: string;
  entity_id?: string;
  diff?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_log", {
    _action: input.action,
    _entity_type: input.entity_type,
    _entity_id: input.entity_id ?? null,
    _diff: (input.diff ?? {}) as never,
  });
  if (error) throw error;
}
