-- Admin → System Log: one read-only report of database health and performance.
-- SECURITY DEFINER so it can read pg_stat_statements, cron, storage and
-- migration history; callers need the 'system.view' permission (admins have all).

CREATE OR REPLACE FUNCTION public.admin_system_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_out jsonb;
BEGIN
  IF v_uid IS NULL OR NOT public.has_permission(v_uid, 'system.view') THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),

    'db', jsonb_build_object(
      'size_bytes', pg_database_size(current_database()),
      'version', split_part(version(), ' on ', 1),
      'started_at', pg_postmaster_start_time(),
      'connections', (
        SELECT jsonb_build_object(
          'total', count(*),
          'active', count(*) FILTER (WHERE state = 'active'),
          'idle', count(*) FILTER (WHERE state = 'idle'),
          'max', current_setting('max_connections')::int)
        FROM pg_stat_activity WHERE datname = current_database()),
      'cache_hit_pct', (
        SELECT round(100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2)
        FROM pg_statio_user_tables),
      'index_hit_pct', (
        SELECT round(100.0 * sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2)
        FROM pg_statio_user_indexes),
      'tables', (
        SELECT coalesce(jsonb_agg(t ORDER BY t.total_bytes DESC), '[]'::jsonb) FROM (
          SELECT s.relname AS name, s.n_live_tup AS rows,
                 pg_total_relation_size(s.relid) AS total_bytes,
                 s.seq_scan, s.seq_tup_read, coalesce(s.idx_scan, 0) AS idx_scan,
                 s.n_dead_tup AS dead_rows, greatest(s.last_autovacuum, s.last_vacuum) AS last_vacuum
            FROM pg_stat_user_tables s WHERE s.schemaname = 'public') t),
      'migrations', (
        SELECT jsonb_build_object('count', count(*), 'latest', max(version))
        FROM supabase_migrations.schema_migrations),
      'storage', (
        SELECT jsonb_build_object(
          'files', count(*),
          'bytes', coalesce(sum((metadata->>'size')::bigint), 0),
          'by_bucket', coalesce((
            SELECT jsonb_agg(b ORDER BY b.bytes DESC) FROM (
              SELECT bucket_id AS bucket, count(*) AS files, coalesce(sum((metadata->>'size')::bigint), 0) AS bytes
                FROM storage.objects GROUP BY bucket_id) b), '[]'::jsonb))
        FROM storage.objects),
      'counts', jsonb_build_object(
        'users', (SELECT count(*) FROM auth.users),
        'customers', (SELECT count(*) FROM user_roles WHERE role = 'customer'),
        'staff', (SELECT count(*) FROM user_roles WHERE role IN ('admin', 'staff')),
        'products', (SELECT count(*) FROM products),
        'orders', (SELECT count(*) FROM orders),
        'orders_today', (SELECT count(*) FROM orders WHERE created_at >= date_trunc('day', now())))
    ),

    'perf', jsonb_build_object(
      'stats_since', (SELECT stats_reset FROM pg_stat_statements_info),
      'slowest', (
        SELECT coalesce(jsonb_agg(q), '[]'::jsonb) FROM (
          SELECT left(regexp_replace(s.query, '\s+', ' ', 'g'), 220) AS query, s.calls,
                 round(s.mean_exec_time::numeric, 2) AS mean_ms, round(s.max_exec_time::numeric, 2) AS max_ms,
                 round(s.total_exec_time::numeric, 0) AS total_ms, s.rows
            FROM pg_stat_statements s JOIN pg_roles r ON r.oid = s.userid
           WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
             AND s.query !~* '(pg_catalog|information_schema|pg_timezone_names|set_config\()'
           ORDER BY s.mean_exec_time DESC LIMIT 10) q),
      'most_called', (
        SELECT coalesce(jsonb_agg(q), '[]'::jsonb) FROM (
          SELECT left(regexp_replace(s.query, '\s+', ' ', 'g'), 220) AS query, s.calls,
                 round(s.mean_exec_time::numeric, 2) AS mean_ms, round(s.total_exec_time::numeric, 0) AS total_ms
            FROM pg_stat_statements s JOIN pg_roles r ON r.oid = s.userid
           WHERE r.rolname IN ('anon', 'authenticated', 'service_role', 'authenticator')
             AND s.query !~* '(pg_catalog|information_schema|pg_timezone_names|set_config\()'
           ORDER BY s.calls DESC LIMIT 10) q),
      'full_scans', (
        SELECT coalesce(jsonb_agg(t ORDER BY t.seq_tup_read DESC), '[]'::jsonb) FROM (
          SELECT relname AS name, seq_scan, seq_tup_read, coalesce(idx_scan, 0) AS idx_scan, n_live_tup AS rows
            FROM pg_stat_user_tables
           WHERE schemaname = 'public' AND seq_scan > 0 AND n_live_tup > 100
           ORDER BY seq_tup_read DESC LIMIT 8) t),
      'cron', (
        SELECT coalesce(jsonb_agg(j ORDER BY j.jobname), '[]'::jsonb) FROM (
          SELECT jb.jobname, jb.schedule, jb.active,
                 lr.status AS last_status, lr.start_time AS last_run,
                 round(extract(epoch FROM lr.end_time - lr.start_time) * 1000) AS last_ms,
                 left(lr.return_message, 160) AS last_message,
                 (SELECT count(*) FROM cron.job_run_details d
                   WHERE d.jobid = jb.jobid AND d.status = 'failed' AND d.start_time > now() - interval '24 hours') AS failures_24h
            FROM cron.job jb
            LEFT JOIN LATERAL (SELECT * FROM cron.job_run_details d WHERE d.jobid = jb.jobid
                                ORDER BY d.start_time DESC LIMIT 1) lr ON true) j),
      'rate_limited_last_hour', (
        SELECT coalesce(jsonb_agg(r ORDER BY r.hits DESC), '[]'::jsonb) FROM (
          SELECT split_part(key, ':', 1) AS endpoint, sum(hits) AS hits
            FROM rate_limits WHERE window_start > now() - interval '1 hour'
           GROUP BY 1) r)
    )
  ) INTO v_out;

  RETURN v_out;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_system_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_system_status() TO authenticated;
