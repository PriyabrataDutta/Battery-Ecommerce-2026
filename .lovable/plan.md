
# Bulk Import: Car Brands, Models & Product Fitment

## Step 1 — Edge Function `bulk-import-fitment`

Create `supabase/functions/bulk-import-fitment/index.ts` that:
- Verifies the caller is staff (JWT + role check)
- Receives parsed Excel rows as JSON
- **Upserts car brands** — title-cases names, generates slugs, skips existing
- **Upserts car models** — maps each model to its car brand (by name prefix or single-brand row), generates slugs
- **Upserts battery brands** — creates if missing
- **Upserts products** — matches by name, creates new ones with SKU/slug auto-generated; sets `price_with_exchange`, `price_without_exchange`, `price`, `mrp`
- **Creates fitment links** — `product_fitment` rows, skips duplicates
- Writes an audit log entry
- Returns summary counts

## Step 2 — Update Fitment Admin Page

Update `src/pages/admin/fitment/index.tsx` to add:
- **"Import from Excel"** button (Upload icon) next to the existing "Add Fitment" button
- Hidden file input accepting `.xlsx`
- On file select: parse with existing `parseProductsXlsx()` from `src/lib/parseProductsXlsx.ts`
- Show a confirmation toast with preview counts (X products, Y car brands, Z models)
- Call the edge function via `supabase.functions.invoke("bulk-import-fitment", { body: { rows } })`
- On success: show result toast with created/updated counts, invalidate queries
- On error: show error toast

## Step 3 — Deploy

Deploy the edge function so it's available immediately.

## No DB changes needed
Uses existing tables: `car_brands`, `car_models`, `battery_brands`, `products`, `product_fitment`, `activity_log`. The `price_with_exchange` and `price_without_exchange` columns were already added in the previous step.
