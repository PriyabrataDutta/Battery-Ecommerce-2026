# Backend-Ready Code Restructure (revised)

You're right — Checkout is exactly where backend rewrites hurt most (order creation, address prefill, payment hookup). Migrating it now means your future backend swap is a 1-file change in `src/api/orders.ts`, not surgery on 1,595 lines of UI code.

## Revised scope

**Migrate now (catalog + checkout flow + cart-adjacent):**
- All 10 catalog/search files (Shop, Home, ProductDetail, Brands, BrandPage, SearchResults, FitmentSearch, ShopFilters, ActiveFilters, SmartSearch)
- **Checkout.tsx** — split supabase calls into `api/addresses.ts` + `api/orders.ts`; UI/validation logic untouched
- **Account pages** (Overview, Orders, Profile, Addresses) — these read/write the same tables Checkout does, keeping them consistent

**Still left as-is (lower-value, can migrate later):**
- Auth flow (Auth, ResetPassword, AddPhone, VerifyPhone, useAuth) — auth is a Supabase-specific surface; abstracting it now adds noise without payoff
- Admin pages (AdminLayout, AdminLogin, Dashboard, AuditLog) — internal tooling, low backend-rewrite impact
- Forms (Contact, Quote) — single insert each
- Misc admin helpers (ImageUpload, StatusPicker, RequireStaff, adminLog)

The api/ layer **still includes** these domains (auth, admin, contact, quote) — files exist, just not wired into the unmigrated pages yet. Swap is trivial when you want it.

## New folder structure

```text
src/
├── api/
│   ├── README.md
│   ├── client.ts                 ← single supabase re-export
│   ├── products.ts               ← list, getBySlug, getRelated, byBrand, search
│   ├── productImages.ts
│   ├── categories.ts
│   ├── batteryBrands.ts
│   ├── carBrands.ts
│   ├── carModels.ts
│   ├── productFitment.ts
│   ├── orders.ts                 ← createOrder, listMine, getById
│   ├── addresses.ts              ← list, upsert, delete, getDefault
│   ├── wishlist.ts
│   ├── offers.ts
│   ├── quotes.ts
│   ├── contact.ts
│   ├── blog.ts
│   ├── catalogs.ts
│   ├── settings.ts
│   ├── auth.ts                   ← signUp, signIn, signOut, resetPassword
│   ├── profile.ts                ← getMine, update, verifyPhone
│   ├── storage.ts                ← bucket-specific upload helpers
│   └── admin/
│       ├── users.ts
│       ├── activity.ts
│       └── stats.ts
│
├── hooks/queries/
│   ├── keys.ts                   ← centralized queryKey factory
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useBrands.ts              ← battery + car brands
│   ├── useFitment.ts
│   ├── useAddresses.ts
│   ├── useOrders.ts              ← list + create mutation
│   ├── useProfile.ts
│   ├── useWishlist.ts
│   └── ... (added on demand)
```

## Pattern

**api/ file** — pure async, typed, throws on error:
```ts
// src/api/orders.ts
import { supabase } from "./client";

export interface CreateOrderInput {
  userId: string;
  items: Array<{ product_id: string; product_name: string; product_sku?: string; qty: number; unit_price: number }>;
  subtotal: number; tax: number; shipping: number; discount: number; total: number;
  customer: { name: string; email: string; phone: string };
  address: Record<string, unknown>;
  payment_method: string;
  delivery_method: string; delivery_label: string;
  scheduled_date?: string; scheduled_slot?: string;
  promo_code?: string; promo_label?: string;
  notes?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const { data: order, error } = await supabase.from("orders").insert({
    user_id: input.userId, subtotal: input.subtotal, tax: input.tax,
    shipping: input.shipping, discount: input.discount, total: input.total,
    customer_name: input.customer.name, customer_email: input.customer.email,
    customer_phone: input.customer.phone, address: input.address,
    payment_method: input.payment_method, delivery_method: input.delivery_method,
    delivery_label: input.delivery_label, scheduled_date: input.scheduled_date,
    scheduled_slot: input.scheduled_slot, promo_code: input.promo_code,
    promo_label: input.promo_label, notes: input.notes, status: "pending",
  }).select("id, order_number").single();
  if (error) throw error;
  const { error: itemsErr } = await supabase.from("order_items").insert(
    input.items.map(i => ({ ...i, order_id: order.id }))
  );
  if (itemsErr) throw itemsErr;
  return order;
}

export async function listMyOrders(userId: string) { /* ... */ }
export async function getOrderById(id: string)     { /* ... */ }
```

**hooks/queries/ file** — React Query wrapper:
```ts
// src/hooks/queries/useOrders.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "@/api/orders";
import { qk } from "./keys";

export const useMyOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.orders.mine(userId),
    queryFn: () => ordersApi.listMyOrders(userId!),
    enabled: !!userId,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all }),
  });
};
```

**Rules** (in `api/README.md`):
1. Components/pages never import `@/integrations/supabase/client`. Only `src/api/` does.
2. One api file per domain, named after the table/concern.
3. Reads → `useQuery` hook. Writes → `useMutation` hook.
4. All query keys live in `keys.ts` for predictable invalidation.
5. When you swap to a custom backend, you edit `src/api/*` only — the rest of the app is untouched.

## Files touched

**New (~22):** all `src/api/*` files + `src/hooks/queries/*` + `api/README.md`

**Edited (~15):**
- 10 catalog/search files
- `src/pages/Checkout.tsx` (replace 2 supabase calls with `useAddresses` + `useCreateOrder`)
- `src/pages/account/AccountOrders.tsx`
- `src/pages/account/AccountAddresses.tsx`
- `src/pages/account/AccountProfile.tsx`
- `src/pages/account/AccountOverview.tsx`

**Untouched (working as-is):** Auth flow, Admin pages, Contact, Quote, OrderConfirmation, misc helpers.

## Tasks

1. Build `src/api/client.ts` + all 18 api domain files (full domain coverage).
2. Build `src/hooks/queries/keys.ts` + hooks for migrated domains.
3. Migrate 10 catalog/search files.
4. Migrate Checkout.tsx (api calls only — UI/validation untouched).
5. Migrate 4 account pages.
6. Write `src/api/README.md`.
7. Verify catalog pages, checkout end-to-end, and account pages render and submit identically.

Approve and I'll execute.
