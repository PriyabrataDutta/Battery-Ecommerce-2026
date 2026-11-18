import { supabase } from "../client";

export interface TableStat {
  name: string;
  rows: number;
  total_bytes: number;
  seq_scan: number;
  seq_tup_read: number;
  idx_scan: number;
  dead_rows: number;
  last_vacuum: string | null;
}
export interface QueryStat {
  query: string;
  calls: number;
  mean_ms: number;
  max_ms?: number;
  total_ms: number;
  rows?: number;
}
export interface CronStat {
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null;
  last_run: string | null;
  last_ms: number | null;
  last_message: string | null;
  failures_24h: number;
}
export interface SystemStatus {
  generated_at: string;
  db: {
    size_bytes: number;
    version: string;
    started_at: string;
    connections: { total: number; active: number; idle: number; max: number };
    cache_hit_pct: number | null;
    index_hit_pct: number | null;
    tables: TableStat[];
    migrations: { count: number; latest: string | null };
    storage: { files: number; bytes: number; by_bucket: { bucket: string; files: number; bytes: number }[] };
    counts: { users: number; customers: number; staff: number; products: number; orders: number; orders_today: number };
  };
  perf: {
    stats_since: string | null;
    slowest: QueryStat[];
    most_called: QueryStat[];
    full_scans: { name: string; seq_scan: number; seq_tup_read: number; idx_scan: number; rows: number }[];
    cron: CronStat[];
    rate_limited_last_hour: { endpoint: string; hits: number }[];
  };
}

/** Admin → System Log. Requires the system.view permission (checked in the database). */
export async function getSystemStatus(): Promise<SystemStatus> {
  const { data, error } = await supabase.rpc("admin_system_status");
  if (error) throw error;
  return data as unknown as SystemStatus;
}
