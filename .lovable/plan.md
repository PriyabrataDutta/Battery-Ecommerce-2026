## Goal

Make `/admin` a real, fully-featured control center for the entire website — like the EBASCO reference. Every sidebar item must be a working page that lets you view, create, edit, and delete the corresponding website data. Today most are placeholders; this plan replaces all of them with real management screens backed by the existing database tables.

## What's wrong today

- Admin shell looks right, but `Categories`, `Brands`, `Fitment`, `Media`, `Offers`, `Catalogs`, `Settings`, `Overview`, `Users`, `Orders`, `Quotes`, `Callbacks`, `Messages`, `Content`, `Blog`, `Activity Log`, `System Monitor` are all stub pages with one sentence of text.
- Only `Products`, `ProductForm`, `BulkUpload` and the dashboard actually do anything.
- Result: you can see the dashboard, but you can't actually run the site from `/admin`.

## What "fully featured" means here

Every management page follows the same pattern so the whole admin feels consistent:

```text
[Page header]  Title + count + "New" button + search/filter bar
[Data table ]  Sortable columns, row actions (edit, delete, status change)
[Side drawer]  Create/edit form opens in a Sheet (no full page nav)
[Empty state]  Friendly message + "Create first ..." CTA
[Bulk acts  ]  Multi-select + delete / change status
```

All writes go through Supabase with existing `is_staff()` RLS, so security is unchanged.

## Pages to build (each one is real, not a stub)

### Catalog group

- **Categories** — table of `categories` (name, slug, parent, sort, image). Create/edit drawer with image upload to `product-images`, parent picker (self-referential), auto-slug. Delete with "in use by N products" guard.
- **Brands** — table of `battery_brands` (logo, name, slug, sort, products count). Drawer to upload logo to `brand-logos`, edit description, reorder.
- **Car Fitment** — two-pane manager. Left: `car_brands` list + add/edit. Right: `car_models` for selected brand (name, years, slug). Plus a "Map products" tab that lets you pick a model and tick which products fit it (`product_fitment` junction).
- **Bulk Upload** — already exists, leave as-is but link results into Products list.
- **Media** — gallery view of files in the `product-images`, `brand-logos`, `blog`, `catalogs` buckets. Upload, copy URL, delete. Bucket switcher tabs.
- **Offers** — needs a new `offers` table (title, code, type percent/flat, value, starts_at, ends_at, is_active, applies_to). Standard table + drawer. Used later by cart for discounts.
- **Catalogs** — table of `catalog_files` (title, category, size, download). Upload PDF to `catalogs` bucket, set title/description/category.
- **Settings** — single-form page editing a new `site_settings` key/value table: store name, contact phone, WhatsApp number, email, address, hero copy, social links, GST/footer text. Also "danger zone" (clear cart sessions etc).

### Management group

- **Overview** — same KPI strip + a compact "today vs yesterday" panel and quick links. (Distinct from Sales Dashboard which is the chart-heavy view.)
- **Users** — list of `profiles` joined with `user_roles` and `auth.users.email` (via a staff-only RPC). Columns: name, email, phone, company, roles, joined. Row actions: promote to staff/admin, demote to customer, view orders. Search by name/email.
- **Orders** — table of `orders` with status pill, customer, total, date. Click row → drawer showing line items (`order_items`), shipping address, notes, status timeline. Status changer (pending → ordered → in_progress → dispatched → in_transit → delivered, plus cancelled / returned). Export CSV.
- **Quote Requests** — table of `quote_requests` with name/company/phone/email/status. Drawer shows full requirement, BOQ file link, lets staff change status (new → contacted → quoted → won/lost) and add internal notes.
- **Callback Requests** — table of `callback_requests` with phone, preferred time, message, status. One-click "Mark contacted" + WhatsApp/Tel quick-launch buttons.
- **Contact Messages** — inbox-style list of `contact_messages`. Click to read full message in side panel, mark resolved, reply via mailto.
- **Content** — homepage section editor backed by `site_settings`: hero headline/subhead/CTA, "Why Kachi" bullet list, featured brand/category sections, banner toggles. Saves to `site_settings` and storefront reads from it.
- **Blog** — table of `blog_posts`. Editor drawer with title, slug (auto), cover image upload, excerpt, body (textarea with Markdown), publish toggle. List filter: published/drafts.

### Super Admin group

- **Activity Log** — needs a new `activity_log` table written by triggers/RPCs on important actions (product create/update/delete, order status change, role change, bulk import). Read-only table with actor email, action, target, timestamp, JSON diff in popover. Includes a manual "log entry" already happens for bulk imports.
- **System Monitor** — health panel: counts (products, orders, users), storage usage per bucket (via RPC), recent edge function errors (link out), database row counts, quick "rebuild slugs" / "recompute exchange rebate" maintenance buttons.

## Backend changes (one migration)

New tables (all with `is_staff()` RLS for write, sensible read policies):

- `offers` — title, code (unique), type ('percent'|'flat'), value, starts_at, ends_at, is_active, applies_to jsonb.
- `site_settings` — key (text PK), value (jsonb), updated_at, updated_by. Public read so storefront can read hero text etc.
- `activity_log` — actor_id, actor_email, action, entity_type, entity_id, diff jsonb, created_at. Staff read only.

New RPCs (SECURITY DEFINER, staff-gated):

- `admin_list_users()` — joins `profiles` + `user_roles` + `auth.users.email`. Avoids exposing `auth.users` directly.
- `admin_set_user_role(user_id, role)` — replaces caller's roles for that user.
- `admin_storage_usage()` — returns bytes per bucket from `storage.objects`.
- `admin_log(action, entity_type, entity_id, diff)` — inserts into `activity_log`. Called from frontend after writes.

Indexes added on hot filter columns: `orders(status, created_at)`, `quote_requests(status)`, `callback_requests(status)`, `contact_messages(status)`, `products(status, stock)`, `activity_log(created_at)`.

## Frontend pieces to add

Shared building blocks so every page looks the same and stays small:

- `AdminPageHeader` — title, count, primary action, search input.
- `EntityTable` — wrapper around `DataTable` adding multi-select, row actions menu, empty state, loading skeleton.
- `EntityDrawer` — shadcn `Sheet` with form, save/cancel, delete confirm.
- `useAdminCrud(table, queryKey)` hook — wraps list/create/update/delete with React Query invalidation + toast + activity_log write.
- `StatusPicker` — inline dropdown for changing order/request status with optimistic update.
- `MarkdownEditor` — textarea with preview tab (used by Blog and Content).
- `BucketBrowser` — used by Media page.

Storefront integration so the admin actually controls the site:

- `Home`, `Footer`, `Header` read hero text, contact info, brand name from `site_settings` (with sensible defaults).
- `Cart`/checkout consults `offers` for coupon validation.
- `Blog` storefront page (already routed) lists `blog_posts` where `is_published = true`.

## Approach

1. Run the migration (offers, site_settings, activity_log + indexes + RPCs). One migration, then types regenerate.
2. Build the shared components (`AdminPageHeader`, `EntityTable`, `EntityDrawer`, `useAdminCrud`, `StatusPicker`, `MarkdownEditor`, `BucketBrowser`).
3. Replace stubs page-by-page in this order so the most useful management lands first:
   Orders → Quotes → Callbacks → Messages → Categories → Brands → Fitment → Media → Catalogs → Offers → Blog → Content → Settings → Users → Activity Log → System Monitor.
4. Wire storefront reads to `site_settings` and `offers` so changes in admin show up on the site.
5. Verify `/admin` end-to-end in the preview: create a category, create a brand, edit homepage hero, change an order's status, mark a callback contacted, publish a blog post.

## What stays the same

- `/admin` shell, sidebar groups, EBASCO-style header, Sales Dashboard charts, RequireStaff guard, existing Products and BulkUpload pages.

## Out of scope (call out so we agree)

- Email/SMS notifications when orders or requests change status (can add later via edge function + Resend).
- Inventory ledger / stock-movement history (only current `stock` column managed).
- Multi-currency, multi-language.

This is a big build. Scale-wise it touches ~16 admin pages plus shared infra. Approve and I'll start with the migration, then ship pages in the order above so each step is usable on its own.