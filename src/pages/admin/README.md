# Admin Dashboard

The admin surface lives under `src/pages/admin/`. It's gated by
`<RequireStaff />` and uses a single-page tabbed layout (`AdminLayout.tsx`)
that swaps in panel components based on the `useAdminTab` zustand store.

## Folder structure

```
src/pages/admin/
├── AdminLayout.tsx            Top-level shell (header, sidebar, panel switcher).
├── AdminLogin.tsx             Standalone admin sign-in.
├── Dashboard.tsx              KPI + charts panel ("dashboard" tab).
├── AuditLog.tsx               Activity log panel ("audit-log" tab).
├── Placeholder.tsx            Generic "coming soon" card (kept for future panels).
├── products/                  ✅ Catalog CRUD — see ./products/README.md
├── orders/                    ✅ Orders triage + status — see ./orders/README.md
├── brands/                    ✅ Battery brand CRUD — see ./brands/README.md
├── categories/                ✅ Category CRUD with parent picker — see ./categories/README.md
├── users/                     ✅ User list + role mgmt + invites — see ./users/README.md
├── quotes/                    ✅ B2B quote_requests triage — see ./quotes/README.md
├── messages/                  ✅ Contact form + callbacks (tabbed) — see ./messages/README.md
└── settings/                  ✅ site_settings JSONB editor — see ./settings/README.md
```

Each panel folder follows the same skeleton:

```
<panel>/
├── index.tsx          Orchestrator: filter state + composition.
├── README.md          What it does + how to extend it.
├── components/        Toolbar, Table, Editor / Detail drawer.
└── hooks/             React Query hooks (one file per panel).
```

API for admin writes lives in `src/api/admin/` — never call Supabase
directly from a panel component:

```
src/api/admin/
├── activity.ts    Audit log reads + log helper.
├── brands.ts      Battery brand CRUD.
├── categories.ts  Category CRUD.
├── messages.ts    contact_messages + callback_requests reads + status.
├── orders.ts      Admin orders list + status/notes mutations.
├── products.ts    Admin products list + create/update/delete.
├── quotes.ts      quote_requests reads + status.
├── settings.ts    site_settings CRUD.
├── stats.ts       Dashboard KPI helpers.
└── users.ts       User listing / role updates / invites.
```

## How to add a new admin panel

1. **Create the feature folder** — e.g. `src/pages/admin/brands/`
   with `index.tsx`, `components/`, `hooks/`, optional `lib/`,
   and a `README.md`. Mirror the pattern in `products/`.
2. **Add the API layer** — put reads/writes in `src/api/admin/<name>.ts`.
   Every mutation should call `logActivity(action, entity, id, diff)`
   from `@/lib/adminLog` for the audit trail.
3. **Wrap reads/writes in React Query hooks** inside `hooks/`. Use a
   stable query key like `["admin", "<name>"]` so mutations can
   invalidate cleanly.
4. **Register the tab** — add the tab name in `src/stores/dashboardTabs.ts`
   (`AdminTab` type), then in `AdminSidebar.tsx` add a `sections` entry,
   and in `AdminLayout.tsx` add it to the `titleMap` and `PANELS` map.
5. (Optional) Reuse `AdminPlaceholder` from `Placeholder.tsx` while you build.

## Conventions

- All admin routes are gated by `<RequireStaff />` (in `AdminLayout`).
- RLS does the real authorization — every `is_staff(auth.uid())`-protected
  table is safe even if a non-staff user opens the admin URL.
- Use semantic tokens (`bg-card`, `border-line`, `text-warning`) — never
  hard-coded colors.
- Use the shared primitives from `src/components/admin/`:
  - `EntityTable` for list views.
  - `EntityDrawer` for slide-out create/edit.
  - `StatusBadge` for status pills (read-only).
  - `StatusPicker` for inline status changes in tables (lighter than the
    full drawer).
- Keep panel files small: orchestrator (`index.tsx`) wires state +
  composition; everything else is a component, hook, or lib helper.
