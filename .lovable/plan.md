
## Overview

Update the car brand count badges so they count only **in-stock products** (stock > 0) by default, giving users an accurate picture of what's actually available.

No new DB tables or migrations. Two files edited.

---

## Changes

### 1. Edit `src/api/productFitment.ts` — `getCarBrandProductCounts()`

Add an `inStockOnly` parameter (default `true`):

- After collecting all fitment `product_id`s per brand, make one additional query: `SELECT id FROM products WHERE id IN (...) AND stock > 0`
- Intersect the result with each brand's product set before counting
- When `inStockOnly` is false, behaviour is unchanged (counts all products)

This adds **1 extra SELECT** (only the `id` column, filtered by stock) — lightweight and only runs once per cache window.

### 2. Edit `src/hooks/queries/useFitment.ts` — `useCarBrandProductCounts()`

- Pass `true` to `getCarBrandProductCounts(true)` so counts reflect in-stock products
- Update the query key to include the flag so React Query caches correctly: `qk.fitment.carBrandCounts(true)`

### 3. Edit `src/hooks/queries/keys.ts`

- Update `carBrandCounts` key factory to accept `inStockOnly` boolean: `carBrandCounts: (inStock?: boolean) => ["fitment", "carBrandCounts", inStock] as const`

---

## Result

- Car brand badges show count of in-stock products only
- Brands with zero in-stock products show "0" (still visible, not hidden — so admins know the brand exists)
- No UI changes needed — the existing count badge renders the new number automatically
