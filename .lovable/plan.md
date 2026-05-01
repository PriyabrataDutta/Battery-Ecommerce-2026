## Problem

Visiting `/account/profile` (and similar deep links like `/account/orders`, `/account/addresses`) shows a blank/404 page. The router only registers `/account` and `/admin` as single routes — the active section is driven by a `zustand` tab store, not the URL. So any sub-path falls through to `NotFound`.

The `AccountMenu` in the header already links to `/account/orders`, `/account/addresses`, `/account/profile`, so these need to resolve.

## Fix

Bind each dashboard tab to the URL using a `:tab?` route param, while keeping the existing tab store for persistence and in-page switching.

### 1. Router (`src/App.tsx`)

Change two route entries:

```text
/account            -> /account/:tab?
/admin              -> /admin/:tab?
```

This makes `/account`, `/account/profile`, `/account/orders`, `/admin`, `/admin/products`, etc. all resolve to the same layout component.

### 2. `AccountLayout.tsx`

- Read `tab` from `useParams()`.
- If the URL `tab` is a valid `AccountTab`, render that panel and sync it into the store.
- If the URL has no `tab`, use the persisted store tab (current behaviour).
- If the URL `tab` is invalid, redirect to `/account`.
- Sidebar buttons become `<Link to={`/account/${tab}`}>` so the URL updates on click (still calling `setTab` for persistence).

### 3. `AdminLayout.tsx`

Same treatment with `AdminTab`:
- Read `tab` from `useParams()`, validate against the `AdminTab` union.
- Sync URL ↔ store.
- Update `AdminSidebar` items to navigate to `/admin/<tab>` instead of (or in addition to) calling `setTab`.
- Invalid tab → redirect to `/admin`.

### 4. Small helper

Add a tiny guard `isAccountTab(value): value is AccountTab` (and `isAdminTab`) next to the union types in `src/stores/dashboardTabs.ts` so both layouts can validate the param without duplicating arrays.

## Files touched

- `src/App.tsx` — make `/account` and `/admin` accept an optional `:tab?` param.
- `src/stores/dashboardTabs.ts` — export `ACCOUNT_TABS`, `ADMIN_TABS` arrays + `isAccountTab` / `isAdminTab` guards.
- `src/pages/account/AccountLayout.tsx` — URL-driven tab selection, sidebar buttons → `<Link>`.
- `src/pages/admin/AdminLayout.tsx` — same pattern.
- `src/components/admin/AdminSidebar.tsx` — sidebar items navigate via `<Link to={`/admin/${tab}`}>`.

## Result

- `/account/profile`, `/account/orders`, `/account/addresses`, `/account/wishlist`, `/account/quotes`, `/account/support`, `/account/overview` all render the correct panel — no more 404.
- `/admin/products`, `/admin/orders`, `/admin/brands`, `/admin/categories`, `/admin/users`, `/admin/quotes`, `/admin/messages`, `/admin/settings`, `/admin/audit-log` all deep-link correctly.
- Bare `/account` and `/admin` still work and use the persisted tab.
- Existing in-app sidebar navigation continues to feel instant (still backed by zustand) but now also updates the URL so refresh / share / back-button work.
