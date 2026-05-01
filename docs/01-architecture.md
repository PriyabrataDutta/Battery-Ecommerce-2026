# Architecture

Four layers, top to bottom. Each layer only talks to the one directly below
it. That's the whole architecture.

```text
 ┌─────────────────────────────────────────────────────────┐
 │ Pages (src/pages)        — route entry points           │
 │   • compose feature components                          │
 │   • call hooks from src/hooks/queries                   │
 │   • handle navigation, page-level state                 │
 ├─────────────────────────────────────────────────────────┤
 │ Feature components                                      │
 │   src/components/**, src/pages/<page>/components/**     │
 │   • presentational + small interactions                 │
 │   • receive data via props OR call query hooks          │
 ├─────────────────────────────────────────────────────────┤
 │ Hooks (src/hooks/queries)                               │
 │   • React Query wrappers around api/* functions         │
 │   • own the cache keys (qk in keys.ts)                  │
 │   • where mutations declare what to invalidate          │
 ├─────────────────────────────────────────────────────────┤
 │ API layer (src/api)                                     │
 │   • the ONLY place that imports the supabase client     │
 │   • pure async functions, no React, no hooks            │
 │   • one file per domain (products, orders, addresses…)  │
 ├─────────────────────────────────────────────────────────┤
 │ Backend (Lovable Cloud / Supabase)                      │
 │   • Postgres + Auth + Storage + Edge Functions          │
 └─────────────────────────────────────────────────────────┘
```

## Why this shape?

**Replaceability.** Swapping the backend means rewriting `src/api/*`
and nothing else. Components don't know what database is behind them.

**Caching for free.** Every read goes through React Query, so duplicate
requests are de-duped, lists stay fresh, and invalidation is a one-line
`qc.invalidateQueries({ queryKey: qk.orders.all })`.

**Findability.** "Where does the cart's product price come from?" is
answered by walking down the layers: `Cart.tsx` → `useProducts` hook →
`api/products.ts`. Three files, in three predictable places.

## A worked example: opening the Shop page

```text
User visits /shop
        │
        ▼
src/App.tsx          ← maps "/shop" to <Shop />
        │
        ▼
src/pages/Shop.tsx   ← reads URL params, calls hooks
        │
        ├─► useProducts(filters)        from src/hooks/queries/useProducts.ts
        │       │
        │       ▼
        │   listProducts(filters)        from src/api/products.ts
        │       │
        │       ▼
        │   supabase.from("products")    ← only place supabase appears
        │
        └─► <ShopFilters /> + <ProductCard />  from src/components/products/
```

## What "feature folder" means

When a page grows past ~250 lines it becomes a folder:

```
src/pages/checkout/
├── index.tsx              ← what App.tsx imports
├── README.md              ← what does this page do?
├── components/            ← parts only this page uses
├── lib/                   ← pure helpers + constants
└── hooks/                 ← page-local hooks (rare)
```

`App.tsx` keeps doing `import Checkout from "./pages/Checkout"`-style
imports because folder + `index.tsx` resolves the same way as a single file.
