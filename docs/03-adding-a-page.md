# Adding a page

Goal: a new `/wishlist` page that lists the signed-in user's saved products.

## 1. Make sure the api function exists

Open `src/api/wishlist.ts`. If `listMyWishlist(userId)` already exists,
skip ahead. If not, add it:

```ts
// src/api/wishlist.ts
import { supabase } from "./client";

export async function listMyWishlist(userId: string) {
  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id, products(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
```

## 2. Wrap it in a React Query hook

```ts
// src/hooks/queries/useWishlist.ts
import { useQuery } from "@tanstack/react-query";
import { listMyWishlist } from "@/api/wishlist";
import { qk } from "./keys";

export function useMyWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: qk.wishlist.mine(userId),
    queryFn: () => listMyWishlist(userId!),
    enabled: Boolean(userId),
  });
}
```

Add the key to `src/hooks/queries/keys.ts`:

```ts
wishlist: {
  all: ["wishlist"] as const,
  mine: (uid?: string) => ["wishlist", "mine", uid] as const,
},
```

## 3. Build the page

```tsx
// src/pages/Wishlist.tsx
import { useAuth } from "@/hooks/useAuth";
import { useMyWishlist } from "@/hooks/queries/useWishlist";
import { ProductCard } from "@/components/products/ProductCard";

export default function Wishlist() {
  const { user } = useAuth();
  const { data, isLoading } = useMyWishlist(user?.id);

  if (isLoading) return <p>Loading…</p>;
  return (
    <div className="container-x py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
      {data?.map((row) => (
        <ProductCard key={row.product_id} product={row.products} />
      ))}
    </div>
  );
}
```

## 4. Wire the route

In `src/App.tsx`, lazy-load it and add a route:

```tsx
const Wishlist = lazy(() => import("./pages/Wishlist"));

// inside <Routes>:
<Route path="/wishlist" element={<Wishlist />} />
```

If the page must require auth, wrap it:

```tsx
<Route element={<RequirePhoneVerified />}>
  <Route path="/wishlist" element={<Wishlist />} />
</Route>
```

## 5. Done

Visit `/wishlist`. React Query handles loading, caching, refetching. If you
later add a "remove from wishlist" mutation, declare it in
`useWishlist.ts` with an `onSuccess` that invalidates `qk.wishlist.mine(uid)`.

## When the page grows up

If `Wishlist.tsx` crosses ~250 lines, promote it to a folder:

```
src/pages/wishlist/
├── index.tsx          (what was Wishlist.tsx)
├── README.md
├── components/
└── lib/
```

Update the import in `App.tsx`? **No** — folder + `index.tsx` resolves the
same way. Existing `import Wishlist from "./pages/Wishlist"` keeps working.
