# Kachi Batteries — Development Plan

Living roadmap for www.kachibatteries.com (React + Vite on Vercel, Supabase project `kachi-prod`).
Update it as items ship. Effort: **S** ≈ under half a day · **M** ≈ 1–2 days · **L** ≈ 3+ days.
Owner: **Dev** (code) · **Biz** (store owner: accounts, content, decisions).

---

## 0. Where we are (as of 2026-11-18)

**Done**
- Own Supabase project (Mumbai), data migrated off Lovable Cloud; GitHub → Vercel auto-deploy; live on `www.kachibatteries.com`.
- Settings/secrets locked down (`private_settings`), Drizzle removed, single migration source (`supabase/migrations`).
- Orders priced and placed **server-side** (`place_order`): GST-inclusive pricing, promos from `offers`, stock reserved, idempotent retries, stock returned on cancel/refund.
- Cashfree online payments built (create/verify/webhook, 30-min expiry of unpaid orders) — **not yet tested with real keys**. COD live.
- 66 car batteries from the price list, with fitment and optimised official photos.
- Sign-up: field validation, honeypot, Cloudflare Turnstile, server-side rate limits, sign-up circuit breaker; Google sign-in; phone format normalised.
- Branded auth emails via Resend (Send Email hook); domain verified.
- White-screen-after-deploy fix, faster navigation, missing indexes, batched fitment import.

**Switched off on purpose**
- Customer mobile OTP verification (`PHONE_VERIFICATION_REQUIRED = false` in `src/lib/phone.ts`).

**Tests to keep green** — `npm test` · `supabase db query --linked -f supabase/tests/pricing_check.sql` · `node supabase/tests/cashfree_signature_check.mjs` · `node supabase/tests/auth_email_check.mjs`.

---

## 1. Before taking real orders at scale (do first)

| # | Item | Why | Effort | Owner |
|---|---|---|---|---|
| 1.1 | **Upgrade Supabase to Pro** ($25/mo) | Free plan has **no backups**, pauses when idle, 5 GB/month transfer (~10k visits) | S | Biz |
| 1.2 | **Cashfree end-to-end test** — sandbox keys → test UPI/card order → paid in admin; then production keys, webhook URL, domain whitelist | Online payment is built but unproven | S | Biz + Dev |
| 1.3 | **Order emails** — confirmation, status changes (shipped/delivered/cancelled), payment received; staff "new order" alert | Customers get nothing after ordering today | M | Dev |
| 1.4 | **Order status rules + history** — allowed transitions only (pending→paid/processing→shipped→delivered; cancel/refund from valid states), `order_status_history` table, who/when | Admin can jump any status to any other | M | Dev |
| 1.5 | **Second admin** — fix `admin_create_admin_profile` / invite flow (fails for people who haven't signed up), role changes keep `admin_profiles` in sync | Single admin = single point of failure | M | Dev |
| 1.6 | **Admin session hardening** — "Remember me" off by default, 7-day cap, sign out current device only (not global), share session across tabs | Admin sessions effectively never expire | S | Dev |
| 1.7 | **Real contact details** — replace `+91 99999 99999` / WhatsApp placeholders (header, footer, product page, floating buttons) with values from Admin → Settings → Store | Customers can't call or WhatsApp the store | S | Dev + Biz |
| 1.8 | **Review the 7 non-car sample products** (inverter, tubular, SMF, lithium, clearance) — real prices, photos, stock or archive | Look like Lovable demo data | S | Biz |
| 1.9 | **Footer social links, About/Contact copy, terms & privacy, refund/return policy pages** | Required for trust and payment-gateway approval | M | Biz + Dev |

---

## 2. Security & data integrity

| # | Item | Effort |
|---|---|---|
| 2.1 | **Enforce staff permissions in the database** — RLS / RPCs check `has_permission` per table (today any staff can read/write everything; tabs are only hidden in the UI) | L |
| 2.2 | **Returns workflow in the DB** — transitions + roles enforced server-side, keep separate verifier/approver, FKs to orders/items, eligibility window | M |
| 2.3 | **Reviews integrity** — FKs, one review per customer per product, verified-purchase flag, no image adds after approval | S |
| 2.4 | **Sanitise search input** — escape `,()%_` before PostgREST `.or()/ilike` (SmartSearch, SearchResults, admin lists, audit log) | S |
| 2.5 | **Sanitise rich text** — DOMPurify for blog `post.body`; escape `</script>` in product JSON-LD | S |
| 2.6 | **Replace `xlsx@0.18.5`** (known CVEs) with a maintained parser; move admin Excel parsing server-side | M |
| 2.7 | **Remove Lovable leftovers** — `src/integrations/lovable`, `previewAuthStorage`, `.lovable/`, `lovable-tagger`, `@lovable.dev/*` deps | S |
| 2.8 | **Security headers** on Vercel — CSP (allow Supabase, Cashfree, Turnstile), HSTS, X-Frame-Options, Referrer-Policy | S |
| 2.9 | **RLS performance** — use `(select auth.uid())` in policies so it's evaluated once per query | S |
| 2.10 | **Phone-login enumeration** — keep rate limit; optionally require Turnstile on the lookup | S |
| 2.11 | **Admin audit log shows everything** — not only session events; add server-side audit triggers on all admin-editable tables | M |
| 2.12 | Time-boxed sessions (Supabase Pro setting) for staff | S |

---

## 3. Customer experience

| # | Item | Effort |
|---|---|---|
| 3.1 | **Order detail & tracking page** — clickable rows in Account → Orders, items, payment status, status timeline, "Complete payment" for unpaid online orders, cancel while pending | M |
| 3.2 | **GST tax invoice (PDF)** per order — GSTIN, HSN, tax breakup; downloadable by customer and admin | M |
| 3.3 | **Product page** — quantity stepper (capped by stock), reset state when moving between products, clearer exchange explanation, compatible-cars list | S |
| 3.4 | **Pincode serviceability** — real list of serviceable pincodes/cities and delivery ETA (the old fake check was removed) | M |
| 3.5 | **Returns UI for customers** — request a return from an order (API exists, no screen) | M |
| 3.6 | **Address book** — edit address, set default, validate GSTIN/phone | S |
| 3.7 | **Mobile OTP verification** back on — preferably real SMS (MSG91/Twilio via Supabase phone auth) instead of email codes | M |
| 3.8 | **Abandoned-cart reminder** email (opt-in) | M |
| 3.9 | **Compare batteries** (capacity, warranty, price) for the same car | M |
| 3.10 | **Accessibility** — keyboard mega-menu, labelled inputs/search combobox, focus trap in mobile search, star rating labels, placeholder contrast | M |
| 3.11 | **Dark mode** — either finish it or remove the half-built `.dark` theme | S |

---

## 4. Catalog, search & content

| # | Item | Effort |
|---|---|---|
| 4.1 | **Server-side shop search & filters** — one RPC with filters/sort/pagination + facet counts, `pg_trgm` indexes (Shop currently loads all products into the browser; fine at 73, not at 1,000+) | L |
| 4.2 | **SmartSearch as one RPC** instead of 5 queries per keystroke | S |
| 4.3 | **Unify filter URL params** — `min_capacity`, `segment`, `fuel`, `onSale`… are linked from menus but ignored by Shop | S |
| 4.4 | **Missing data from the price list** — 5 unnamed batteries (rows 30, 32, 43, 46, 47), Endeavour 2018+ and Toyota Velfire have no battery | S (Biz names) |
| 4.5 | **Exact photos** for the 13 range-photo products (mostly Power Zone) and the non-car products | S (Biz) |
| 4.6 | **Inverter / UPS catalogue** — fitment by home load (VA, backup hours) instead of car model | L |
| 4.7 | **One import pipeline** — upload → staging table → dry-run preview → apply in one transaction → import report; retire the browser row-by-row importer and the broken `bulk-import-products` function | L |
| 4.8 | **Media library safety** — block deleting images still used by products; clean up orphaned files | S |
| 4.9 | **Blog** — real articles (battery care, car-specific guides) for SEO | Biz |

---

## 5. Admin panel

| # | Item | Effort |
|---|---|---|
| 5.1 | **Offers/promo codes screen** — create, schedule, deactivate, usage limits, per-customer limits (today only via the Supabase table editor) | M |
| 5.2 | **Dashboard** — remove fake fallback charts, exclude cancelled/refunded from revenue, real low-stock list, daily orders | S |
| 5.3 | **Product editor data-loss fixes** — don't overwrite fitment/gallery before they load; save product + fitment + images in one transaction; validate MRP | M |
| 5.4 | **Fitment admin** — paginate past 1,000 rows, confirm deletes, preview before Excel import | M |
| 5.5 | **Permissions editor** — add `reviews.manage` / `returns.manage` checkboxes; confirm role changes; block demoting the last admin in the UI | S |
| 5.6 | **Order tools** — print packing slip, export CSV, filter by payment status, staff notes vs customer notes kept separate (done in data, polish UI) | M |
| 5.7 | **Inventory** — low-stock alert email, stock adjustment log | M |
| 5.8 | **Payment & notification settings** — `notification_settings` is saved but unused; wire to the order-email outbox (1.3) | S |

---

## 6. SEO, analytics & marketing

| # | Item | Effort |
|---|---|---|
| 6.1 | **Pre-render** product, brand, category and blog pages at build time so crawlers and social previews see content (only consider Next.js if this isn't enough) | M |
| 6.2 | **Sitemap refresh on product changes** (Vercel deploy hook or scheduled rebuild) | S |
| 6.3 | **noindex** cart, checkout, account, search, admin | S |
| 6.4 | **Social preview image** — replace the Lovable screenshot (`og:image`) with a brand image; per-product OG images | S |
| 6.5 | **Product structured data** — only emit the "with exchange" offer when exchange exists; add brand, GTIN if available | S |
| 6.6 | **Google Merchant Center feed** (free listings in Google Shopping) | M |
| 6.7 | **Analytics** — GA4 / Meta pixel behind a consent banner; ecommerce events (view, add to cart, checkout, purchase) | M |
| 6.8 | **Google Business Profile & reviews** link-up | Biz |

---

## 7. Performance

| # | Item | Effort |
|---|---|---|
| 7.1 | **Split the main JS bundle** (build warns about chunk size) — vendor chunks, lazy-load heavy libs (charts, xlsx, gsap) | S |
| 7.2 | **Responsive images** — Supabase image transformations or Vercel Image for thumbnails vs full size | M |
| 7.3 | **Lighthouse pass** on Home, Shop, Product (Core Web Vitals) | S |
| 7.4 | **Single auth context** — `useAuth` is per component today (duplicate listeners/queries) | M |

---

## 8. Engineering & operations

| # | Item | Effort |
|---|---|---|
| 8.1 | **CI on GitHub Actions** — typecheck, lint, `npm test`, build, signature/email checks on every push/PR | S |
| 8.2 | **End-to-end tests** (Playwright) — sign-up, Google redirect, add to cart, COD checkout, admin login, order status change | M |
| 8.3 | **Error monitoring** — Sentry for the site and edge functions; uptime monitor for the homepage and `place_order` | S |
| 8.4 | **Backups** — Pro daily backups; keep the pre-migration `pg_dump` habit; consider PITR once revenue justifies it | S |
| 8.5 | **Preview deployments** for branches (already automatic on Vercel) — work on branches, merge to `main` to release | S |
| 8.6 | **Staging Supabase project** (declined for now) — revisit once more than one developer works on the DB | — |
| 8.7 | **TypeScript strict mode**, folder by folder | L |
| 8.8 | **Enforce the API-layer rule** — lint rule against importing the Supabase client outside `src/api`; migrate the ~35 offenders | M |
| 8.9 | **Remove dead code** — unused pages (`Account.tsx`, `Index.tsx`, `AccountPlaceholder`), admin components (`DataTable`, `StatusPicker`, `ImageUpload`, `MarkdownEditor`, `AdminPageHeader`), unused API functions | S |
| 8.10 | **Update `docs/`** — several pages are out of date (cart store, phone gate, Lovable Cloud references, file paths) | S |
| 8.11 | **Dependency updates** — Dependabot/Renovate; `npm audit` | S |

---

## Suggested order

1. **Launch-ready (1–2 weeks):** 1.1–1.9, 2.4, 2.5, 2.7, 8.1, 8.3.
2. **Trust & operations (2–3 weeks):** 1.3/1.4 polish, 3.1, 3.2, 3.5, 5.1–5.3, 2.1, 2.2, 2.11.
3. **Growth (ongoing):** 4.1–4.3, 6.1–6.7, 3.4, 3.7, 7.x.
4. **Scale & hygiene:** 4.6, 4.7, 8.2, 8.7, 8.8.

## Decisions needed (Biz)

- Supabase Pro start date; Cashfree live go-ahead.
- Serviceable cities/pincodes and delivery ETAs; whether express/installation pricing changes by city.
- Return/refund policy (days, conditions) — drives 2.2 and 3.5.
- Names for the 5 unnamed batteries; real data for the 7 sample products.
- SMS provider for OTP (MSG91 vs Twilio) and when to turn verification back on.
- Which analytics/marketing tools, and cookie-consent wording.
