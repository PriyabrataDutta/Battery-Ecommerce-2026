
# Connect Products to Car Fitment

## Current State

The frontend fitment search (`FitmentSearch`, `ShopFilters`, `Shop`) **already fetches car brands and car models from the database** and filters products via the `product_fitment` table. This is all working correctly.

The issue: **the `product_fitment` table is empty** (0 rows). Your 12 active products have no car model mappings, so the "Find My Battery" search always returns zero results.

There are 20+ car brands and 400+ car models already in the DB — they just aren't linked to any products.

---

## What We'll Build

### 1. Add Fitment Section to Product Editor

Add a "Car Fitment" section to the product create/edit drawer so you can assign which car brands and models each battery fits:

- **Car brand dropdown** → select a brand (e.g. "Maruti Suzuki")
- **Car model multi-select** → pick models under that brand (e.g. "Swift", "Baleno", "Dzire")
- **Add button** → adds the selected models to the fitment list
- **Chip display** → shows all assigned fitment as removable chips grouped by brand
- When saving the product, the system writes the correct `product_fitment` rows

When editing an existing product, the drawer pre-loads its current fitment mappings.

### 2. Bulk Fitment Assignment (Quick Map)

Add a "Map Fitment" button on the Products list page that opens a streamlined dialog:

- Pick a product from a dropdown
- Select multiple car brands → their models appear as checkboxes
- Check the models this battery fits → save
- This is faster than opening each product's editor one by one

### 3. Sort Order Fix for Car Brands

The `FitmentSearch` component sorts by `sort_order`, but all brands currently have `sort_order = 0`. We'll update popular brands (Maruti Suzuki, Hyundai, Tata, Honda, etc.) to appear first in the dropdown.

---

## Technical Details

**Files to modify:**
- `src/pages/admin/products/components/ProductEditor.tsx` — add fitment section with brand/model selection and chip display
- `src/pages/admin/products/hooks/useAdminProducts.ts` — add hooks to fetch car brands, models, and product fitment; add mutation to save fitment
- `src/pages/admin/products/index.tsx` — add "Map Fitment" dialog

**No DB schema changes needed** — the `product_fitment` table already exists with the right structure (product_id + car_model_id). RLS policies are already in place (public read, staff write).

**No edge function changes** — fitment writes go directly via the Supabase client (staff RLS allows it).
