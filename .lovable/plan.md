# Admin Optimization Plan — Speed, Security, System Design

Targeted, low-risk improvements to the existing admin. No UI redesign, no behavior changes the user has to learn. Each item lists what changes and why.

---

## 1. Speed

### 1.1 Code-split every admin panel
Today `AdminLayout.tsx` eagerly imports **all 10 panels** (Dashboard, Products, Orders, Brands, Categories, Users, Quotes, Messages, Settings, AuditLog). The first admin page paint pulls in editors, charts (recharts), markdown editor, and image upload — even when the user only opens the Dashboard.

- Convert each panel import to `React.lazy` and wrap `<ActivePanel />` in `<Suspense>` with a tiny skeleton.
- Split out heavy deps (recharts → only on Dashboard, markdown editor → only on Products).
- **Expected win:** ~50–70% smaller initial admin JS, faster login → dashboard.

### 1.2 Parallelize and cache the AdminLayout role lookup
`AdminLayout` does its own `user_roles` fetch on every mount; `RequireStaff` already does an `is_staff` RPC and there's an `is_staff` boolean on `useAuth`. Result: 2–3 redundant role round-trips per page load.

- Move the "Super Admin / Staff" label into a single React Query keyed by `user.id` (`staleTime: 5 min`), reused across the layout.
- Drop the duplicate fetch in `AdminLayout`.

### 1.3 Dashboard query consolidation
`Dashboard.tsx` fires **7 parallel queries** for KPIs plus 3 more (monthly, status, top products = pulls **all** `order_items`). The top-products query has no limit and no aggregation — it grows linearly with order volume.

- Add a `admin_dashboard_summary()` SQL function returning KPIs + monthly buckets + status counts + top-5 products in one round trip.
- Replace 4 client queries with one. Cache 60s with React Query.
- **Expected win:** dashboard goes from 10 requests to 1; scales as data grows.

### 1.4 Server-side pagination on list panels
`listAdminProducts`, `listAdminOrders`, `getActivityLog`, etc. fetch up to 200 rows then filter/sort client-side. Fine today, painful at 1k+ rows.

- Add `page`, `pageSize`, and `cursor` (created_at) params to admin list APIs.
- Add a small reusable `usePaginatedQuery` helper; render "Load more" / page nav in the existing tables.

### 1.5 Add missing indexes
From `pg_stat_user_indexes` the only indexes seeing scans are `user_roles_user_id_role_key`, `orders_status_created_idx`, and `products_status_stock_idx`. Several frequently-filtered columns lack supporting indexes for the admin search/sort patterns:

- `products (lower(name) text_pattern_ops)` and `(lower(sku))` — for the `ilike` search.
- `orders (lower(customer_email))`, `(lower(customer_name))`, `(customer_phone)` — same reason.
- `activity_log (actor_id, created_at desc)` — for "filter by admin" view.

Done via a single migration.

### 1.6 Remove the per-route remount churn
`<main key={tab}>` forces a full subtree remount on every tab switch, throwing away any React Query data the panels just fetched.

- Remove the `key`, let React reconcile. Panels still re-render because route params change.

---

## 2. Security

### 2.1 Tighten `is_admin_email` (login enumeration)
`is_admin_email` is callable by `anon` and returns `true/false` for any email — an attacker can enumerate admin accounts at the login form (proven in our own logs: 2 calls revealing valid/invalid status).

- Move admin-email validation to a single edge function (`admin-login-precheck`) that:
  - Rate-limits per IP (sliding window, e.g. 5/min) using a `login_attempts` table.
  - Always returns the same generic error after N failures.
  - Optionally returns "ok" only after a successful Supabase password verification — don't expose admin-status before authentication.
- Revoke `EXECUTE` on `public.is_admin_email(text)` from `anon`/`authenticated`.

### 2.2 Add a `login_attempts` audit + lockout
No brute-force protection right now. Combined with #2.1:

- New table `login_attempts (email_hash, ip, success, created_at)` — service-role-only.
- Edge function checks last 15 min: ≥5 failures from same IP or email → temporary block + `activity_log` entry.

### 2.3 Verify RLS coverage with the linter
Run `supabase--linter` and fix any flagged tables. Specifically confirm:
- `admin_profiles_self_update` only allows non-privileged columns (currently it lets a staff user UPDATE *any* row where `id = auth.uid()`, including potentially future role-bearing columns — restrict to `(full_name, phone, avatar_url, title)` via a `BEFORE UPDATE` trigger).
- `user_roles.roles_admin_all` is admin-only ✓.
- `activity_log` is read-only (no INSERT/UPDATE/DELETE policies) ✓ and only writable via `admin_log()` SECURITY DEFINER ✓.

### 2.4 Server-side check on every admin mutation
`AdminLayout` already uses `RequireStaff`, but every admin API call also depends on RLS. Audit each mutation in `src/api/admin/*` to confirm the underlying RLS policy is `is_staff(auth.uid())` (mostly true) and add a server-side guard for the few that go through RPC (already done for `admin_set_user_role`, `admin_create_admin_profile`).

### 2.5 Strengthen `admin_set_user_role`
Currently any staff can set any non-admin role. Add:
- Prevent self-demotion that would orphan the last admin (count check).
- Prevent staff from modifying other admins.

### 2.6 Idle / session hardening
`RequireStaff` is solid (idle timeout, ephemeral-orphan, re-verify every 60s). Two small gaps:
- `setRememberMe` writes to `localStorage` — tampering can extend session. Move to `sessionStorage` + signed flag in JWT custom claim (Cloud auth hook), or accept and document.
- The `is_staff` re-verify runs every 60 s even on hidden tabs. Skip when `document.hidden`.

### 2.7 Enable HIBP password check
Turn on `password_hibp_enabled` so admin password resets reject leaked passwords. One-line config.

---

## 3. System Design

### 3.1 Single source of truth for admin tabs
Tab metadata is duplicated across `AdminLayout` (`titleMap`, `PANELS`), `AdminSidebar`, `dashboardTabs.ts`, and `RequireStaff`. Adding a tab requires editing 4 files.

- Define one `ADMIN_TABS` array: `{ id, title, icon, path, lazyComponent, requiredRole }`.
- Layout, sidebar, and route guard read from this array.
- Enables per-tab role gating (e.g. only `admin` sees Users/Settings).

### 3.2 Standardize the admin data layer
`src/api/admin/*` files mix conventions: some return raw rows, some throw, some swallow errors. Pages call them via custom hooks (`useAdminProducts`, etc.) but every hook re-implements query keys, invalidation, and error toasts.

- Introduce `createAdminResource<T>({ key, list, get, create, update, remove })` factory that produces typed React Query hooks with consistent keys (`['admin', resource, ...]`), automatic invalidation, and unified error handling (toast + Sentry-ready hook).
- Migrate panels one at a time; old hooks keep working during transition.

### 3.3 Centralize audit logging
Currently every mutation manually calls `logActivity(...)`. Easy to forget. Two improvements:
- Add Postgres `AFTER INSERT/UPDATE/DELETE` triggers on `products`, `orders`, `categories`, `battery_brands`, `site_settings` that write to `activity_log` automatically with `auth.uid()` and a row diff. Drop the client-side `logActivity` calls for those tables.
- Keep client-side `admin_log()` only for non-table actions (login, signout, session events).

### 3.4 Edge-function boundary for sensitive ops
Anything that needs service-role keys, IP, or rate-limiting belongs in an edge function, not in the browser:
- `admin-login-precheck` (see 2.1)
- `admin-bulk-import-products` (CSV upload — currently absent, will be added cleanly when needed)
- `admin-export` (large CSV exports stream from server, not 200-row client downloads)

### 3.5 Predictable folder layout
Today: `src/pages/admin/{feature}/index.tsx + components + hooks`, `src/api/admin/{feature}.ts`, `src/components/admin/*` shared. This is good. Two cleanups:
- Move `AdminLogin.tsx` and `AdminLayout.tsx` into `src/pages/admin/_shell/` to separate the shell from feature panels.
- Co-locate the API file with the page: `src/pages/admin/products/api.ts` (re-export from `src/api/admin/products.ts` for back-compat). Reduces cross-tree jumps when working on a panel.

### 3.6 Type safety for SQL responses
Several admin RPCs (`admin_list_users`, `admin_order_status_counts`) cast results to `any`. Auto-generated types from Supabase already cover them — drop the casts and let TypeScript catch shape drift.

---

## Technical details (for reference)

### New SQL (one migration)

```sql
-- 1.5 indexes
create index if not exists products_name_lower_idx on public.products (lower(name) text_pattern_ops);
create index if not exists products_sku_lower_idx  on public.products (lower(sku)  text_pattern_ops);
create index if not exists orders_email_lower_idx  on public.orders   (lower(customer_email));
create index if not exists orders_name_lower_idx   on public.orders   (lower(customer_name));
create index if not exists activity_log_actor_idx  on public.activity_log (actor_id, created_at desc);

-- 1.3 dashboard summary
create or replace function public.admin_dashboard_summary()
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'kpis', (select jsonb_build_object(...) where is_staff(auth.uid())),
    'monthly', (...),
    'status', (...),
    'topProducts', (...)
  );
$$;
revoke execute on function public.admin_dashboard_summary() from anon;

-- 2.1 lock down is_admin_email
revoke execute on function public.is_admin_email(text) from anon, authenticated;

-- 2.5 admin guard
-- updated admin_set_user_role with last-admin check and "no editing peers"

-- 3.3 audit triggers (one per table)
create or replace function public.tg_audit_row() returns trigger ...;
```

### Files touched (high level)
- `src/App.tsx` — keep as-is.
- `src/pages/admin/AdminLayout.tsx` — lazy panels, drop role refetch, drop `key`.
- `src/pages/admin/AdminLogin.tsx` — call new edge function instead of `is_admin_email`.
- `src/pages/admin/Dashboard.tsx` — replace 4 queries with one `admin_dashboard_summary` call.
- `src/api/admin/*.ts` — pagination params; refactor through `createAdminResource` factory (incremental).
- `src/components/auth/RequireStaff.tsx` — skip re-verify when tab hidden.
- New: `supabase/functions/admin-login-precheck/index.ts`.
- New: `src/pages/admin/_lib/tabs.ts` (single source of tab metadata).

### Out of scope (intentionally)
- No UI redesign of any admin panel.
- No change to customer-facing routes.
- No data migration (only DDL + functions).

---

## Suggested rollout order

1. **Migration + linter** (indexes, dashboard RPC, lock down `is_admin_email`, HIBP). Zero UI risk.
2. **Edge function** `admin-login-precheck` + AdminLogin swap. Tested in isolation.
3. **Lazy panels + role-fetch dedupe + Dashboard consolidation.** Big perf win, low risk.
4. **Pagination on Products/Orders/Activity log.**
5. **Audit triggers + drop client-side `logActivity` for table mutations.**
6. **`createAdminResource` factory + tabs single-source.** Refactor, no behavior change.

Each step ships independently and is reversible.
