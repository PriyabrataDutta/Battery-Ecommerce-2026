
## Overview

Replace the single-GST-rate system with a multi-rate GST catalog. Admins create GST entries (e.g. "GST 5%", "GST 12%", "GST 18%", "GST 28%") in the Settings > GST tab, then select the applicable GST rate when adding/editing a product.

Checkout calculates tax per line item based on each product's assigned GST rate.

---

## Database Changes

### New table: `gst_rates`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| label | text | e.g. "GST 18%" |
| rate | numeric | Percentage, e.g. 18 |
| hsn_code | text | Optional HSN/SAC code |
| is_default | boolean | One default for products without explicit assignment |
| created_at | timestamptz | |

- RLS: Public read (needed at checkout), staff write
- Seed with standard Indian GST slabs: 0%, 5%, 12%, 18%, 28%

### Alter `products` table
- Add column `gst_rate_id uuid REFERENCES gst_rates(id)` (nullable, falls back to default rate)

---

## Settings > GST Tab Changes

Rework the tab into two sections:
1. **GST Rates** — a CRUD table to add/edit/delete GST slabs (label, rate %, HSN code, default toggle)
2. **Business Details** — GSTIN, legal name, state, breakup toggle (kept from current)

---

## Product Editor Changes

Add a "GST Rate" dropdown in the **Pricing & Stock** section of `ProductEditor.tsx` that lists all `gst_rates` entries. If none selected, the product uses the default rate.

Update `ProductEditableFields` to include `gst_rate_id: string | null`.

---

## Checkout Changes

- Fetch `gst_rates` table at checkout
- For each cart item, look up its product's `gst_rate_id` → get the rate %
- Calculate tax per line item and sum (instead of a flat rate on the whole subtotal)
- Update `calcTotals` to accept a per-item tax map
- `useGstSettings` hook updated to also expose the rates lookup

---

## Files

**New / Modified**:
| File | Change |
|------|--------|
| Migration | Create `gst_rates` table + add `gst_rate_id` to products + seed data |
| `src/pages/admin/settings/tabs/GstTab.tsx` | Rewrite with rates CRUD + business details |
| `src/api/admin/products.ts` | Add `gst_rate_id` to `ProductEditableFields` |
| `src/pages/admin/products/lib/constants.ts` | Add `gst_rate_id` to `EMPTY_PRODUCT` |
| `src/pages/admin/products/components/ProductEditor.tsx` | Add GST rate dropdown |
| `src/hooks/useGstSettings.ts` | Also export `useGstRates()` for fetching all rates |
| `src/pages/checkout/lib/totals.ts` | Per-item tax calculation |
| `src/pages/checkout/index.tsx` | Wire per-product GST rates |
