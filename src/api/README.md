# `src/api/` — Backend Layer

This folder is the **single home for every backend call** in the app.
When the backend gets rewritten, you edit files in here. Nothing else.

## Why this exists

Pages and components used to import the database client directly. That meant
~32 files knew about Supabase. Swapping or extending the backend would have
required touching all of them.

Now there's exactly **one rule**:

> Components, pages and hooks **never** import
> `@/integrations/supabase/client`. They import from `@/api/*` (or, for
> reads, from `@/hooks/queries/*`).

If you find yourself reaching for `supabase.from(...)` inside a `.tsx` file,
stop and add a function to the matching `src/api/*.ts` file instead.

## Folder map

```
src/api/
├── client.ts              ← single re-export of the supabase client
├── products.ts            ← list, getBySlug, getRelated, search, suggest
├── productImages.ts       ← gallery for one product
├── categories.ts
├── batteryBrands.ts
├── carBrands.ts
├── carModels.ts
├── productFitment.ts      ← which products fit which car models
├── orders.ts              ← createOrder, listMine, overview summary
├── addresses.ts           ← list, getDefault, create, setDefault, delete
├── wishlist.ts
├── offers.ts
├── quotes.ts
├── contact.ts
├── blog.ts
├── catalogs.ts
├── settings.ts            ← site_settings key/value
├── profile.ts             ← getMine, updateMine
├── auth.ts                ← signIn, signUp, signOut, resetPassword, ...
├── storage.ts             ← bucket upload helpers
└── admin/
    ├── users.ts           ← admin_list_users, set_user_role, invite
    ├── activity.ts        ← log + listActivityLog
    └── stats.ts           ← order status counts, storage usage
```

## Conventions

1. **Pure async functions.** Each function takes plain arguments, returns a
   typed domain object (or `void`), and `throw`s on error. No React, no hooks.
2. **One file per domain.** Named after the table or feature.
3. **Domain types live in the api file** when they don't already exist in
   `src/types/catalog.ts`. Promote them to `src/types/` if more than one api
   file needs them.
4. **No business logic.** Validation, formatting, totals — those belong in
   the page/component or in `src/lib/`. The api layer is a thin adapter.

## Reads vs. writes

- **Reads** → wrap with a `useQuery` hook in `src/hooks/queries/`.
  Components import the hook, never the api function directly.
- **Writes** → wrap with a `useMutation` hook (also in `src/hooks/queries/`)
  for anything that should invalidate cache. One-off form submits (Contact,
  Quote) can call the api function directly.

## Query keys

All query keys live in `src/hooks/queries/keys.ts` under the `qk` factory.

```ts
queryKey: qk.products.bySlug(slug)
qc.invalidateQueries({ queryKey: qk.orders.all })
```

This makes it trivial to grep for "where is this cache invalidated?" — search
for `qk.orders` and you'll find every place.

## Adding a new endpoint

1. Add the function in the matching `src/api/<domain>.ts`. If no domain file
   fits, create one.
2. If reads → add a `useQuery` hook in `src/hooks/queries/use<Domain>.ts`,
   plus a key in `keys.ts`.
3. If writes → add a `useMutation` hook with `onSuccess` invalidations.
4. Use the hook from your component.

## Migration status

These call sites have been migrated and only use api/ + hooks/queries:

- `src/pages/Home.tsx`
- `src/pages/Shop.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/Brands.tsx`
- `src/pages/BrandPage.tsx`
- `src/pages/SearchResults.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/account/AccountOverview.tsx`
- `src/pages/account/AccountOrders.tsx`
- `src/pages/account/AccountAddresses.tsx`
- `src/pages/account/AccountProfile.tsx`
- `src/components/products/FitmentSearch.tsx`
- `src/components/products/ShopFilters.tsx`
- `src/components/products/ActiveFilters.tsx`
- `src/components/search/SmartSearch.tsx`

Still using `supabase` directly (will migrate when next touched):

- Auth pages (`Auth.tsx`, `ResetPassword.tsx`, `AddPhone.tsx`, `VerifyPhone.tsx`)
- Admin pages (`admin/AdminLayout.tsx`, `admin/AdminLogin.tsx`,
  `admin/Dashboard.tsx`, `admin/AuditLog.tsx`)
- Forms (`Contact.tsx`, `Quote.tsx`)
- Misc (`useAuth.ts`, `RequireStaff.tsx`, `PostLogoutRedirect.tsx`,
  `ImageUpload.tsx`, `StatusPicker.tsx`, `lib/adminLog.ts`)

The api functions for these domains (`auth.ts`, `admin/*`, `contact.ts`,
`quotes.ts`, `storage.ts`) **already exist** — wiring them in is a small
mechanical change when you next visit those files.
