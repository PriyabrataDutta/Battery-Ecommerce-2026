## Goal

Ship a complete staff-only admin at `/admin/*` that lets you manage everything in the store: products, brands, fitment, orders, quotes, callbacks, contact messages, blog, catalogs — plus the bulk Excel import you already asked for.

---

## 1. Auth (one-time prerequisite)

The store currently has a stubbed `/auth` page. The admin needs real auth.

- Replace `Auth` and `Account` stubs with a real **email + password** sign-in / sign-up page (`/auth`), plus a real `/account` page that shows profile + sign-out. Google sign-in is **not included this round** — easy to add later.
- `src/hooks/useAuth.ts` — listens to `onAuthStateChange`, exposes `{ user, session, isStaff, loading }` (the `isStaff` flag is read once via `is_staff` RPC after each sign-in).
- `src/components/auth/RequireStaff.tsx` — route guard; non-staff gets redirected to `/auth?next=/admin/...`.
- **Promotion to admin**: I'll give you one SQL line to run for your own user once you sign up:
  ```sql
  insert into user_roles (user_id, role)
  values ((select id from auth.users where email = 'you@example.com'), 'admin');
  ```

No DB schema change needed — `user_roles`, `is_staff()`, RLS policies are already in place from earlier.

---

## 2. Admin shell

`src/pages/admin/AdminLayout.tsx` — uses shadcn `Sidebar` + `SidebarProvider`:

```text
┌──────────┬──────────────────────────────────┐
│ KACHI    │  Header (page title • sign out)  │
│ ADMIN    ├──────────────────────────────────┤
│          │                                  │
│ Dashboard│   <Outlet />                     │
│ Products │                                  │
│ Brands   │                                  │
│ Categories                                  │
│ Fitment  │                                  │
│ Orders   │                                  │
│ Quotes   │                                  │
│ Callbacks│                                  │
│ Messages │                                  │
│ Blog     │                                  │
│ Catalogs │                                  │
│ Bulk Up. │                                  │
└──────────┴──────────────────────────────────┘
```

All admin routes are wrapped in `RequireStaff`.

---

## 3. Admin pages — full list

Each page uses TanStack Query against the existing tables (RLS already allows staff full read/write).

| Route | What it does |
|---|---|
| `/admin` (Dashboard) | KPI cards: orders today, revenue (30d), pending quotes, new callbacks, low-stock products. Recent activity table. |
| `/admin/products` | Searchable table (name / SKU / brand / price / stock / status). Inline status toggle. Row click → edit drawer. **New Product** button. |
| `/admin/products/new` & `/admin/products/:id` | Full product form: name, slug (auto), SKU, brand, category, price, MRP, exchange rebate, has_exchange, stock, warranty months, capacity, short/long description, badges, flags (featured/bestseller/new/on-sale), status, primary image upload (to `product-images` bucket), specs key-value editor, fitment picker (multi-select car models grouped by car brand). |
| `/admin/brands` | List + create / edit battery brands (name, slug, logo upload to `brand-logos`, description, sort order). |
| `/admin/categories` | List + create / edit categories (name, slug, parent, image, icon, sort order). |
| `/admin/fitment` | Two-pane editor: left = car brands (CRUD), right = car models for selected brand (CRUD with name + years). |
| `/admin/orders` | List with filters (status, date). Drilldown shows customer, items, totals, status timeline. Status update dropdown (`pending → paid → shipped → delivered → cancelled`). |
| `/admin/quotes` | Quote requests table. Status update + notes. Link to download `boq_file_url` if present. |
| `/admin/callbacks` | Callback requests; mark contacted / closed. Click-to-WhatsApp / call-to-phone shortcuts. |
| `/admin/messages` | Contact form messages; mark read / closed. |
| `/admin/blog` | Posts CRUD: title, slug, cover image upload (`blog` bucket), excerpt, body (textarea — Markdown rendered on the public side), publish toggle. |
| `/admin/catalogs` | Upload PDF catalogs to `catalogs` bucket; list with title / category / file size / delete. |
| `/admin/bulk-upload` | XLSX import (see §5). |

Reusable bits:
- `src/components/admin/DataTable.tsx` — generic table (search + pagination + column config).
- `src/components/admin/ImageUpload.tsx` — drop-zone that uploads to a chosen Supabase Storage bucket and returns a public URL.
- `src/components/admin/StatusBadge.tsx` — coloured badges for order_status / request_status enums.

---

## 4. Image / file uploads

All four buckets already exist (`product-images`, `brand-logos`, `catalogs`, `blog`). I'll add **storage policies** for staff-only writes and public reads where appropriate (catalogs and blog already public; quote-uploads stays private). One small migration:

```sql
-- staff can write to all four content buckets; public can read product/brand/catalog/blog
create policy "staff_write_<bucket>" on storage.objects
  for all to authenticated
  using (bucket_id = '<bucket>' and is_staff(auth.uid()))
  with check (bucket_id = '<bucket>' and is_staff(auth.uid()));
```

(Repeated per bucket; no policy is removed.)

---

## 5. Bulk upload (Excel) — the importer you asked for

Page `/admin/bulk-upload`:

```text
Category: [Car Batteries ▾]   ☐ Wipe & replace before import
[ Drag & drop your XLSX or click to choose ]

→ Parse summary: 79 products • 4 battery brands • N car brands • M car models
→ Preview table (first 5 rows) so you can sanity-check column mapping.

[ Cancel ]                                    [ Import 79 rows ]
```

Client-side (using `xlsx` package, already installed):
1. Read first sheet, normalise column lookups for `Battery Name`, `Battery Brand`, `Car Brand`, `Car Model`, `With Exchange Price`, `Without Exchange Price`, `Warranty`.
2. **Forward-fill continuation rows**: when `Battery Name` is blank, append that row's `Car Brand` / `Car Model` to the previous product's lists. (Your file has these.)
3. Split car brand/model cells on commas → arrays.
4. POST cleaned rows to edge function `bulk-import-products`.

Edge function (service role, after JWT → `is_staff` check):
1. Resolve target category by slug.
2. If `wipe`, delete all products in that category.
3. Upsert `battery_brands` (by slug) → name→id map.
4. Upsert `car_brands` (by slug).
5. Upsert `car_models` by composite slug `${brand}-${model}`, pairing brand[i] with model[i] from the split arrays (fallback: first brand).
6. For each product:
   - `sku` = first all-caps token in name (e.g. `Amaron 105D31L Automotive Battery` → `105D31L`)
   - `slug` = `${brand}-${sku}`
   - `price` = Without Exchange Price
   - `exchange_rebate` = Without − With Exchange (clamped)
   - `warranty_months` = number before `MONTHS`; `specs.warranty_split` = the `(24+24)` portion
   - `has_exchange` = rebate > 0
   - Upsert by `sku`.
   - Replace fitment: delete `product_fitment` rows for that product, insert one per resolved car model.
7. Return `{ upserted_products, fitment_links, errors[] }`. Toast the result.

---

## 6. Files added / changed

```
src/hooks/useAuth.ts                            (new)
src/components/auth/RequireStaff.tsx            (new)
src/pages/Auth.tsx                              (new — replaces stub)
src/pages/Account.tsx                           (new — replaces stub)

src/pages/admin/AdminLayout.tsx                 (new)
src/pages/admin/Dashboard.tsx                   (new)
src/pages/admin/Products.tsx                    (new — list)
src/pages/admin/ProductForm.tsx                 (new — new + edit)
src/pages/admin/Brands.tsx                      (new)
src/pages/admin/Categories.tsx                  (new)
src/pages/admin/Fitment.tsx                     (new)
src/pages/admin/Orders.tsx                      (new)
src/pages/admin/Quotes.tsx                      (new)
src/pages/admin/Callbacks.tsx                   (new)
src/pages/admin/Messages.tsx                    (new)
src/pages/admin/Blog.tsx                        (new)
src/pages/admin/Catalogs.tsx                    (new)
src/pages/admin/BulkUpload.tsx                  (new)

src/components/admin/AdminSidebar.tsx           (new)
src/components/admin/DataTable.tsx              (new)
src/components/admin/ImageUpload.tsx            (new)
src/components/admin/StatusBadge.tsx            (new)
src/lib/parseProductsXlsx.ts                    (new)

supabase/functions/bulk-import-products/index.ts (new)
src/App.tsx                                     (mount /admin/* + real /auth)
src/pages/SimplePages.tsx                       (drop Auth/Account exports)
```

DB migration: storage policies for staff-write on the four buckets. No table-shape changes.

---

## 7. Out of scope (this round, easy follow-ups)

- Stripe checkout (separate request — recommend running it next so admin Orders has real data).
- Google sign-in.
- Rich-text editor for blog (plain Markdown for now).
- Admin role management UI (promote others). Bootstrap stays SQL-based for safety.

After you approve I'll do all of the above in one build, deploy the edge function automatically, and give you the SQL line to make yourself admin once you sign up at `/auth`.
