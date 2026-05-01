# Make the codebase granular + newbie-friendly

## Goal

Two things, done together so they stay consistent:

1. **Granularity** — break the few oversized files into small, focused pieces grouped by feature. Today four files do most of the heavy lifting and are hard to navigate (Checkout = 1,575 lines, ProductDetail = 482, Header = 400, OrderConfirmation = 374).
2. **Developer guide + comments** — add a top-level `docs/` guide and a header comment block to every page/feature folder explaining what it is, where its data comes from, and how to extend it. Written for someone who has never opened the project before.

No behavior changes. No new features. Same routes, same UI, same network calls.

---

## Current size hot-spots (lines)

```
1575  src/pages/Checkout.tsx
 482  src/pages/ProductDetail.tsx
 400  src/components/layout/Header.tsx
 374  src/pages/OrderConfirmation.tsx
 342  src/pages/admin/Dashboard.tsx
 309  src/components/products/ShopFilters.tsx
 307  src/pages/Shop.tsx
 269  src/pages/Auth.tsx
```

Everything else is already a reasonable size.

---

## Part 1 — Granular file structure

Pattern used everywhere: a page that grew big becomes a **folder** with one
`index.tsx` (the page shell + routing-level logic) plus a `components/`
subfolder for its parts and a `lib/` subfolder for its pure helpers/constants.
Imports of the page from `App.tsx` keep working because the folder has an
`index.tsx`.

### 1a. `src/pages/Checkout.tsx` → `src/pages/checkout/`

```
src/pages/checkout/
├── index.tsx                  ← Checkout shell: stepper, draft persistence, placeOrder
├── README.md                  ← how the checkout flow works, top to bottom
├── components/
│   ├── AddressStep.tsx        (was lines 987–1146)
│   ├── DeliveryStep.tsx       (was 1147–1349)
│   ├── PaymentStep.tsx        (was 1350–1424)
│   ├── ReviewStep.tsx         (was 1425–1526)
│   ├── Field.tsx              (was 1527–1556)
│   ├── ReviewBlock.tsx        (was 1557–1574)
│   ├── OrderSummary.tsx       (extract the right-hand totals card)
│   └── PromoInput.tsx         (extract promo-code apply/remove block)
├── lib/
│   ├── constants.ts           DELIVERY_OPTIONS, PAYMENT_OPTIONS, STEPS,
│   │                          PROMO_CODES, slot lists, lead-day maps,
│   │                          DRAFT_KEY/TTL, EMPTY_ADDRESS
│   ├── validation.ts          SAFE_TEXT, GSTIN_REGEX, address validators
│   ├── totals.ts              subtotal / discount / shipping / tax / grand-total
│   ├── draft.ts               read/write/clear the localStorage draft
│   └── types.ts               Address, DeliveryId, PaymentId, Slot, Promo
└── hooks/
    └── useCheckoutState.ts    useReducer or grouped useState for the wizard
```

### 1b. `src/pages/ProductDetail.tsx` → `src/pages/product-detail/`

```
src/pages/product-detail/
├── index.tsx                  ← page shell + data hooks
├── components/
│   ├── ProductGallery.tsx     image carousel + thumbnails
│   ├── ProductInfo.tsx        title, brand, price, stock, add-to-cart
│   ├── ProductSpecs.tsx       spec table (uses SpecRow)
│   ├── ProductTrust.tsx       Trust badges row
│   ├── ProductFitment.tsx     compatible vehicles section
│   ├── RelatedProducts.tsx    related list
│   ├── SpecRow.tsx
│   └── Row.tsx
└── lib/
    └── format.ts              warranty/Ah/CCA formatting helpers
```

### 1c. `src/pages/OrderConfirmation.tsx` → `src/pages/order-confirmation/`

```
src/pages/order-confirmation/
├── index.tsx
└── components/
    ├── OrderHero.tsx          success banner + order number
    ├── OrderItemsList.tsx
    ├── OrderTotals.tsx
    ├── OrderAddressCard.tsx
    └── OrderTimeline.tsx
```

### 1d. `src/components/layout/Header.tsx` → `src/components/layout/header/`

```
src/components/layout/header/
├── index.tsx                  ← Header composition only
├── TopBar.tsx                 promo strip + contact row
├── BrandLogo.tsx
├── DesktopNav.tsx             primary nav links
├── MegaMenu.tsx + MegaCol.tsx
├── HeaderActions.tsx          search button, account, cart badge
├── MobileMenu.tsx             sheet + MobileLink
└── MobileLink.tsx
```

### 1e. `src/pages/admin/Dashboard.tsx` → `src/pages/admin/dashboard/`

```
src/pages/admin/dashboard/
├── index.tsx
└── components/
    ├── KpiCards.tsx
    ├── OrdersByStatusChart.tsx
    ├── RecentOrdersTable.tsx
    ├── LowStockList.tsx
    └── StorageUsageCard.tsx
```

### 1f. `src/pages/Shop.tsx` + `src/components/products/ShopFilters.tsx`

Shop stays a single file but extracts:
- `src/pages/shop/components/ResultsHeader.tsx` (count + sort dropdown + view toggle)
- `src/pages/shop/components/ProductGrid.tsx`
- `src/pages/shop/lib/parseSearchParams.ts` and `buildSearchParams.ts`

`ShopFilters.tsx` splits into:
- `src/components/products/filters/index.tsx` (composition + mobile sheet)
- `filters/PriceRangeFilter.tsx`
- `filters/CarBrandFilter.tsx`
- `filters/CarModelFilter.tsx`
- `filters/BatteryBrandFilter.tsx`
- `filters/CategoryFilter.tsx`

### 1g. `src/pages/Auth.tsx`

Split tabs into:
- `src/pages/auth/index.tsx` (tab shell)
- `auth/SignInForm.tsx`
- `auth/SignUpForm.tsx`
- `auth/GoogleButton.tsx`
- `auth/lib/schemas.ts` (zod schemas)

### What does NOT move

Files under ~150 lines stay where they are. Everything in `src/api/`,
`src/hooks/queries/`, `src/components/ui/`, `src/stores/`, `src/lib/` is
already granular and well-placed.

---

## Part 2 — Newbie developer guide + comments

### 2a. New `docs/` folder at project root

```
docs/
├── README.md                  ← landing page: "start here"
├── 01-architecture.md         ← layers + data flow diagram (ASCII)
├── 02-folder-tour.md          ← every top-level folder, one paragraph each
├── 03-adding-a-page.md        ← step-by-step: route → page folder → api → hook
├── 04-adding-a-table.md       ← migration → types regen → api → hook → UI
├── 05-forms-and-validation.md ← zod + react-hook-form patterns used here
├── 06-auth-and-roles.md       ← useAuth, RequirePhoneVerified, admin gate
├── 07-state-management.md     ← React Query (server) vs Zustand (cart) vs URL (filters)
├── 08-styling.md              ← Tailwind tokens, design system, container-x, ui/
├── 09-common-tasks.md         ← cookbook: add filter, add admin metric, etc.
└── 10-troubleshooting.md      ← typical errors + fixes
```

The architecture diagram (text):

```text
 ┌─────────────────────────────────────────────────────────┐
 │ Pages (src/pages)        — route entry points           │
 │   ├─ compose feature components                         │
 │   └─ call hooks from src/hooks/queries                  │
 ├─────────────────────────────────────────────────────────┤
 │ Feature components (src/components, page-local folders) │
 │   └─ presentational + small interactions                │
 ├─────────────────────────────────────────────────────────┤
 │ Hooks (src/hooks/queries)                               │
 │   └─ React Query wrappers around api/* functions        │
 ├─────────────────────────────────────────────────────────┤
 │ API layer (src/api)                                     │
 │   └─ ONLY place that imports the supabase client        │
 ├─────────────────────────────────────────────────────────┤
 │ Backend (Lovable Cloud / Supabase)                      │
 └─────────────────────────────────────────────────────────┘
```

### 2b. `README.md` at every feature folder

Each new folder (`pages/checkout/`, `pages/product-detail/`, etc.) gets a
short `README.md` that answers four questions:

1. What does this page do (in one sentence)?
2. Which routes hit it?
3. Which api/hook files does it use?
4. Where to add a new field / step / section.

### 2c. File header comments (newbie tone)

Every page/component file in the touched areas gets a header block like:

```ts
/**
 * Checkout — multi-step purchase wizard.
 *
 * Flow: Address → Delivery → Payment → Review → place order.
 *
 * Data in:
 *   - useCart()                  — line items
 *   - useDefaultAddress(userId)  — prefill (api/addresses.ts)
 *   - useMyProfile()             — name/email/phone (api/profile.ts)
 *
 * Data out:
 *   - useCreateOrder()           — writes the order (api/orders.ts),
 *                                  then navigates to /order-confirmation.
 *
 * Adding a new step:
 *   1. Add it to STEPS in lib/constants.ts
 *   2. Create components/<Name>Step.tsx
 *   3. Render it in index.tsx's switch
 *   4. Add validation in lib/validation.ts
 */
```

Inline comments are added **only** where intent isn't obvious — promo logic,
tax rules, draft expiry, the `RequirePhoneVerified` gate. We will not
litter every line with comments; we explain the *why*, not the *what*.

### 2d. Refresh `src/api/README.md`

The migration-status section currently lists pages as "pending" that have
since been migrated. Update it to reflect today's reality and remove stale
pending lists.

### 2e. Top-level `README.md` updates

Add a "Where do I start?" pointer at the top of the project README that
links into `docs/README.md`, plus a one-screen quickstart (install, run,
where the routes live, where the data lives).

---

## Out of scope

- No new features, no UI changes.
- No api/hook signature changes — only file moves and comment additions.
- No test additions (no test setup exists for these pages today).
- Auth, Admin, Contact, Quote pages keep their direct supabase usage for now;
  they're flagged in the api README as "migrate when next touched."

## Risk and verification

- All moves preserve default exports, so `App.tsx` lazy imports keep working
  (`pages/checkout/index.tsx` resolves the same as `pages/Checkout.tsx`
  did via the folder import).
- After each move, the dev server typecheck must pass. We do that
  incrementally (Checkout, then ProductDetail, then Header, then the rest)
  so any breakage is isolated.
- I will manually click through Home → Shop → ProductDetail → Cart → Checkout
  → OrderConfirmation, plus the Account and Admin shells, in the preview
  after the work is done.

## Order of execution

1. Add `docs/` skeleton + updated `src/api/README.md` + root README pointer.
2. Split Checkout (biggest win, biggest risk — done first while attention is fresh).
3. Split ProductDetail.
4. Split Header.
5. Split OrderConfirmation.
6. Split Admin Dashboard.
7. Split Shop + ShopFilters.
8. Split Auth.
9. Add header comments to every touched file + the feature READMEs.
10. Final click-through QA in the preview.
