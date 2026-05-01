
# Restructure Pricing Model & Redesign Product Detail Page

## What changes

### 1. Pricing model simplification

The database already has `mrp`, `price_with_exchange`, and `price_without_exchange` columns on the `products` table. Currently the frontend ignores the explicit exchange/without-exchange columns and derives prices from `price` + `exchange_rebate`. We will switch to using the 3 explicit prices directly.

**New pricing display logic everywhere:**
- **MRP** -- strikethrough price (was already `mrp`)
- **Without Exchange Price** -- the main bold price shown next to MRP (`price_without_exchange`)
- **With Exchange Price** -- highlighted lower price (`price_with_exchange`)
- Discount % calculated from MRP vs Without Exchange Price
- "You save" calculated as MRP - With Exchange Price (when exchange selected)

The old `price` and `exchange_rebate` fields will remain in the DB but the storefront will stop relying on them.

### 2. Update the Product type and cart logic

- Add `price_with_exchange` and `price_without_exchange` to the `Product` type in `src/types/catalog.ts`
- Update `CartItem` to carry both prices instead of `exchangeRebate`
- Update `useCart` effective-price calculation

### 3. Redesign the Product Detail page

Current layout: 3-column (gallery 5 | info 4 | price breakup 3).

**New layout: 2-column (gallery 6 | info+pricing 6)** on desktop, stacked on mobile.

The right column will contain (top to bottom):
- Brand label + Product name + SKU
- Price block: MRP (strikethrough) + Without Exchange price + discount badge
- With Exchange price in a highlighted card
- Short description
- Qty stepper + stock status
- Old battery return toggle (checkbox)
- Pincode check
- CTA buttons (Add to Cart, Buy Now, Request Quote, WhatsApp)
- Trust strip (warranty, genuine, free shipping)

The separate PriceBreakup sticky column will be removed. Instead, a compact order summary will appear inline below the exchange toggle showing the line total based on qty and exchange selection.

### 4. ProductCard update

Update `ProductCard.tsx` to use `price_without_exchange` / `price_with_exchange` / `mrp` directly instead of deriving from `price - exchange_rebate`.

### 5. MobileBottomBar update

Show the selected price (with or without exchange) and keep Add to Cart CTA.

### 6. Admin ProductEditor

The editor already has fields for `price_with_exchange` and `price_without_exchange`. No structural changes needed there, but the Pricing section labels will be clarified to match the new naming (MRP, Without Exchange, With Exchange).

---

## Files to modify

| File | Change |
|------|--------|
| `src/types/catalog.ts` | Add `price_with_exchange`, `price_without_exchange` to `Product`; update `CartItem` |
| `src/hooks/useCart.ts` | Use new price fields |
| `src/components/products/ProductCard.tsx` | Use new 3-price display |
| `src/pages/product-detail/index.tsx` | Switch to 2-col layout, remove PriceBreakup, pass new price props |
| `src/pages/product-detail/components/ProductInfo.tsx` | Rewrite with new price display and integrated order summary |
| `src/pages/product-detail/components/PriceBreakup.tsx` | Remove (or repurpose as inline summary) |
| `src/pages/product-detail/components/MobileBottomBar.tsx` | Use new price fields |
| `src/pages/Cart.tsx` | Use new price fields |
| `src/lib/format.ts` | Add `discountPct` variant for new fields if needed |

No database migration needed -- the columns already exist.
