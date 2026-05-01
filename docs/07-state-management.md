# State management

There are three kinds of state in this app. Pick the right one and life
gets a lot easier.

## 1. Server state → React Query

Anything that lives in the database. Products, orders, addresses, profile,
admin stats. Always accessed through hooks in `src/hooks/queries/`.

```tsx
const { data: products } = useProducts(filters);
const createOrder = useCreateOrder();
```

- Cache keys: factory in `src/hooks/queries/keys.ts` (`qk.orders.all`, etc.).
- Mutations declare what to invalidate in `onSuccess`.
- **Don't** mirror server data into `useState`. Read it from the hook every
  render — React Query keeps it fresh.

## 2. Client state → `useState` / `useReducer` / Zustand

State that exists only in the browser session.

- **Component-local** (form draft, "is dropdown open"): `useState`.
- **Wizard with many fields** (Checkout): `useReducer` is cleaner.
- **Cross-page client state** (cart contents): Zustand, in `src/stores/` or
  `src/hooks/useCart.ts`. Persisted to localStorage by Zustand middleware.

When in doubt, start with `useState`. Promote to a store only when more
than one route needs the same state.

## 3. URL state → search params

Filter selections, search queries, pagination, "view mode". Anything that
should survive a refresh and be shareable.

```tsx
const [params, setParams] = useSearchParams();
const sort = params.get("sort") ?? "newest";
```

Shop is the canonical example: filters live in the URL so you can bookmark
"red Bosch batteries under ₹5,000".

## Decision rule

Ask: *"If the user refreshes the page, should this still be there?"*

- Yes, and the source of truth is the database → React Query.
- Yes, and it's a session-only thing the user picked → URL params.
- Yes, but it's a long-lived choice (cart contents) → Zustand persisted.
- No → `useState`.
