/**
 * Admin → System Log: database performance and status, from one read-only
 * RPC (admin_system_status, needs the system.view permission). Auto-refreshes.
 */
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Loader2, RefreshCw, Database, Gauge, HardDrive, Clock, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSystemStatus, type QueryStat } from "@/api/admin/system";
import { formatBytes } from "@/lib/adminLog";

// Supabase plan limits, for the usage bars (Free → Pro).
const DB_LIMIT_FREE = 500 * 1024 * 1024;
const STORAGE_LIMIT_FREE = 1024 * 1024 * 1024;

type Tone = "good" | "warn" | "bad";
const toneClass: Record<Tone, string> = {
  good: "text-success",
  warn: "text-amber-600",
  bad: "text-destructive",
};
const ago = (iso?: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "—");

function Stat({ label, value, sub, tone, icon: Icon }: { label: string; value: string; sub?: string; tone?: Tone; icon: typeof Gauge }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${tone ? toneClass[tone] : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </Card>
  );
}

function QueryTable({ rows, sortLabel }: { rows: QueryStat[]; sortLabel: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">No queries recorded yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-line">
            <th className="py-2 pr-3">Query</th>
            <th className="py-2 pr-3 text-right whitespace-nowrap">Avg ms</th>
            <th className="py-2 pr-3 text-right">Calls</th>
            <th className="py-2 text-right whitespace-nowrap">Total ms</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q, i) => (
            <tr key={i} className="border-b border-line/60 align-top">
              <td className="py-2 pr-3 font-mono text-[11px] break-all text-ink-soft">{q.query}</td>
              <td className={`py-2 pr-3 text-right font-semibold ${q.mean_ms > 200 ? toneClass.bad : q.mean_ms > 50 ? toneClass.warn : ""}`}>
                {q.mean_ms}
              </td>
              <td className="py-2 pr-3 text-right">{q.calls.toLocaleString("en-IN")}</td>
              <td className="py-2 text-right">{Number(q.total_ms).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-muted-foreground">{sortLabel}. Values like $1 are query parameters.</p>
    </div>
  );
}

export default function SystemLog() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "system-status"],
    queryFn: getSystemStatus,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card className="p-6 text-sm">
        <p className="font-semibold text-destructive">Couldn't load system status.</p>
        <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : "Unknown error"}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Try again</Button>
      </Card>
    );
  }

  const { db, perf } = data;
  const cacheTone: Tone = (db.cache_hit_pct ?? 100) >= 99 ? "good" : (db.cache_hit_pct ?? 100) >= 95 ? "warn" : "bad";
  const connPct = Math.round((db.connections.total / db.connections.max) * 100);
  const connTone: Tone = connPct < 60 ? "good" : connPct < 85 ? "warn" : "bad";
  const slowest = perf.slowest[0]?.mean_ms ?? 0;
  const slowTone: Tone = slowest < 50 ? "good" : slowest < 200 ? "warn" : "bad";
  const cronFailures = perf.cron.reduce((s, j) => s + Number(j.failures_24h), 0);
  const dbPct = Math.min(100, (db.size_bytes / DB_LIMIT_FREE) * 100);
  const stPct = Math.min(100, (db.storage.bytes / STORAGE_LIMIT_FREE) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">System Log</h2>
          <p className="text-sm text-muted-foreground">
            Database performance and status · updated {ago(new Date(dataUpdatedAt).toISOString())} · refreshes every 30 s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="db">DB Status</TabsTrigger>
        </TabsList>

        {/* ─── Performance ─── */}
        <TabsContent value="performance" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Gauge} label="Cache hit rate" value={`${db.cache_hit_pct ?? "—"}%`} sub="Reads served from memory (aim ≥ 99%)" tone={cacheTone} />
            <Stat icon={Activity} label="Connections" value={`${db.connections.total} / ${db.connections.max}`} sub={`${db.connections.active} active · ${db.connections.idle} idle`} tone={connTone} />
            <Stat icon={Clock} label="Slowest query (avg)" value={`${slowest} ms`} sub="Under 50 ms is healthy" tone={slowTone} />
            <Stat icon={RefreshCw} label="Job failures (24 h)" value={String(cronFailures)} sub={`${perf.cron.length} scheduled jobs`} tone={cronFailures ? "bad" : "good"} />
          </div>

          <Section title="Slowest queries" hint="Average time per call, store and admin traffic only.">
            <QueryTable rows={perf.slowest} sortLabel="Sorted by average time" />
          </Section>

          <Section title="Most frequent queries" hint="What the site asks the database most often.">
            <QueryTable rows={perf.most_called} sortLabel="Sorted by number of calls" />
          </Section>

          <div className="grid lg:grid-cols-2 gap-4">
            <Section title="Scheduled jobs" hint="Background tasks run by the database (pg_cron).">
              <ul className="divide-y divide-line text-sm">
                {perf.cron.map((j) => (
                  <li key={j.jobname} className="py-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{j.jobname}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{j.schedule}</span> · last run {ago(j.last_run)}
                        {j.last_ms != null && ` · ${j.last_ms} ms`}
                      </div>
                      {j.last_status === "failed" && j.last_message && (
                        <div className="text-xs text-destructive mt-0.5 break-all">{j.last_message}</div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!j.active && <Badge variant="secondary">paused</Badge>}
                      <Badge variant={j.last_status === "failed" ? "destructive" : j.last_status ? "default" : "secondary"}>
                        {j.last_status ?? "not run yet"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Full table scans" hint="Tables read row-by-row instead of via an index (tables over 100 rows).">
              {perf.full_scans.length ? (
                <ul className="divide-y divide-line text-sm">
                  {perf.full_scans.map((t) => (
                    <li key={t.name} className="py-2 flex justify-between gap-3">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground text-right">
                        {t.seq_scan.toLocaleString("en-IN")} scans · {t.seq_tup_read.toLocaleString("en-IN")} rows read · {t.idx_scan.toLocaleString("en-IN")} index scans
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None — all large tables are using indexes.</p>
              )}
            </Section>
          </div>

          <Section title="Rate limiting (last hour)" hint="Requests counted against limits on phone login and verification codes.">
            {perf.rate_limited_last_hour.length ? (
              <ul className="text-sm divide-y divide-line">
                {perf.rate_limited_last_hour.map((r) => (
                  <li key={r.endpoint} className="py-1.5 flex justify-between">
                    <span>{r.endpoint}</span>
                    <span className="font-semibold">{Number(r.hits).toLocaleString("en-IN")} requests</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No rate-limited traffic in the last hour.</p>
            )}
          </Section>

          <p className="text-[11px] text-muted-foreground">
            Query statistics collected since {perf.stats_since ? format(new Date(perf.stats_since), "dd MMM yyyy, HH:mm") : "database start"}.
          </p>
        </TabsContent>

        {/* ─── DB Status ─── */}
        <TabsContent value="db" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Database className="h-3.5 w-3.5" /> Database size
              </div>
              <div className="mt-1 text-2xl font-bold">{formatBytes(db.size_bytes)}</div>
              <Progress value={dbPct} className="mt-2 h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {dbPct.toFixed(1)}% of Free plan (500 MB) · Pro plan includes 8 GB
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" /> File storage
              </div>
              <div className="mt-1 text-2xl font-bold">{formatBytes(db.storage.bytes)}</div>
              <Progress value={stPct} className="mt-2 h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {db.storage.files} files · {stPct.toFixed(2)}% of Free plan (1 GB) · Pro includes 100 GB
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={Database} label="Postgres" value={db.version.replace("PostgreSQL ", "v")} sub={`Running since ${ago(db.started_at)}`} />
            <Stat icon={Activity} label="Migrations" value={String(db.migrations.count)} sub={`Latest ${db.migrations.latest ?? "—"}`} />
            <Stat icon={Gauge} label="Index hit rate" value={`${db.index_hit_pct ?? "—"}%`} sub="Index reads from memory" />
            <Stat icon={Clock} label="Orders today" value={String(db.counts.orders_today)} sub={`${db.counts.orders} orders in total`} />
          </div>

          <Section title="Records">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
              {[
                ["Accounts", db.counts.users],
                ["Customers", db.counts.customers],
                ["Admin & staff", db.counts.staff],
                ["Products", db.counts.products],
                ["Orders", db.counts.orders],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div className="text-lg font-bold">{Number(v).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Storage by bucket">
            <ul className="text-sm divide-y divide-line">
              {db.storage.by_bucket.map((b) => (
                <li key={b.bucket} className="py-1.5 flex justify-between">
                  <span>{b.bucket}</span>
                  <span className="text-muted-foreground">{b.files} files · {formatBytes(b.bytes)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Tables" hint="Largest first. Dead rows are cleaned up automatically (vacuum).">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-line">
                    <th className="py-2 pr-3">Table</th>
                    <th className="py-2 pr-3 text-right">Rows</th>
                    <th className="py-2 pr-3 text-right">Size</th>
                    <th className="py-2 pr-3 text-right whitespace-nowrap">Dead rows</th>
                    <th className="py-2 pr-3 text-right whitespace-nowrap">Index scans</th>
                    <th className="py-2 text-right whitespace-nowrap">Last vacuum</th>
                  </tr>
                </thead>
                <tbody>
                  {db.tables.map((t) => (
                    <tr key={t.name} className="border-b border-line/60">
                      <td className="py-1.5 pr-3 font-medium">{t.name}</td>
                      <td className="py-1.5 pr-3 text-right">{Number(t.rows).toLocaleString("en-IN")}</td>
                      <td className="py-1.5 pr-3 text-right">{formatBytes(t.total_bytes)}</td>
                      <td className="py-1.5 pr-3 text-right">{Number(t.dead_rows).toLocaleString("en-IN")}</td>
                      <td className="py-1.5 pr-3 text-right">{Number(t.idx_scan).toLocaleString("en-IN")}</td>
                      <td className="py-1.5 text-right text-muted-foreground whitespace-nowrap">{ago(t.last_vacuum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
