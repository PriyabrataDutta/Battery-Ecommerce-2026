## Goal

1. Redesign the **Product Detail page** to match the Amaron PRO reference — image gallery, dual-column layout, structured price-breakup card, pincode delivery check, old-battery-return toggle, trust strip, and tabbed product info.
2. Add **"With Exchange" vs "Without Exchange"** pricing on both the **Product Card** (Shop / listings) and the **Product Detail** page.

---

## 1. Schema change — exchange pricing

Add two columns to `products`:

- `exchange_rebate` numeric — flat amount knocked off when customer returns an old battery (e.g. 2,065)
- `has_exchange` boolean default `true` — whether this product supports old-battery exchange

Migration also seeds existing rows with a sensible default rebate (~10% of price, rounded) so the UI shows real numbers immediately. Admin can edit per product later.

**Derived prices (computed in UI, no extra columns):**
- `priceWithoutExchange = product.price`
- `priceWithExchange = product.price - product.exchange_rebate`

---

## 2. Product Card — dual price display

Update `src/components/products/ProductCard.tsx`:

```text
┌─────────────────────────────┐
│  [product image]            │
├─────────────────────────────┤
│ AMARON • Bestseller         │
│ Amaron PRO 600109087        │
│ SKU: AAM-PR-600109087       │
│                             │
│ ₹20,675   ̶₹̶2̶1̶,̶9̶8̶3̶  -6%   │  ← without exchange (main)
│ ₹18,610  with old battery   │  ← with exchange (smaller, red)
│                             │
│ [ Add ]   [ Quote ]         │
└─────────────────────────────┘
```

- Main bold price = without exchange (MRP strikethrough beside it as today).
- Below it, a red one-liner: **"₹X,XXX with old battery exchange"**.
- Hidden when `has_exchange = false` or `exchange_rebate = 0`.

---

## 3. Product Detail page — Amaron-style redesign

Rebuild `src/pages/ProductDetail.tsx` into a 12-column grid:

```text
Breadcrumb:  Home / Shop / Category / Product

┌──────── Gallery (5 cols) ────────┐  ┌──── Info (4 cols) ────┐  ┌── Price Card (3) ──┐
│  Main image (zoom on hover)      │  │ BRAND tag (red)        │  │ Base Price   ₹21,983│
│  ┌──┐┌──┐┌──┐┌──┐ thumbnails    │  │ H1 Product name        │  │ Discount   – ₹1,308 │
│  └──┘└──┘└──┘└──┘                │  │ SKU                    │  │ ─────────────────── │
└──────────────────────────────────┘  │                        │  │ Total       ₹20,675 │
                                       │ ₹20,675 ̶₹̶2̶1̶,̶9̶8̶3̶ -6%  │  │ Shipping        ₹0  │
                                       │ With exchange: ₹18,610 │  │ ─────────────────── │
                                       │  (save ₹2,065 on old   │  │ To Pay      ₹20,675 │
                                       │   battery return)      │  │                     │
                                       │                        │  │ + upto ₹2,065       │
                                       │ QTY [-1+]   In Stock   │  │   rebate on return  │
                                       │                        │  │                     │
                                       │ PIN [______] [CHECK]   │  │ Total saving ₹3,373 │
                                       │ ☑ Old Battery Return   │  └─────────────────────┘
                                       │                        │
                                       │ [ ADD TO CART ]        │
                                       │ [ ORDER NOW ]          │
                                       │ [ WhatsApp Enquiry ]   │
                                       │                        │
                                       │ 🔧 Zero Maintenance    │
                                       │ 🛡 66 Months Warranty  │
                                       │ ✅ Genuine & Secured    │
                                       └────────────────────────┘

── Tabs: Details | Additional Info | Specs | Warranty | Reviews ──
   Details: full description + spec table (Brand, Series, Item Code,
            Model, Dimensions L×W×H, Weight, Capacity Ah, CCA, Layout,
            Terminal, Warranty months/free + pro-rata)
```

**Pincode check (UI-only for now):**
- Input + "Check" button, shows "Delivery available in 2–4 days" toast for any 6-digit Indian pincode (real serviceability check is a follow-up).

**Old Battery Return checkbox:**
- Toggling it updates the right-side Price Card (subtracts `exchange_rebate` from total).
- "Add to Cart" stores the chosen variant (`withExchange: boolean`) on the cart line so the cart and order reflect the right total.

---

## 4. Cart impact

`useCart` already stores `{id, name, slug, sku, price, image}`. Extend the cart item type with optional `withExchange?: boolean` and `exchangeRebate?: number`; when present, line total uses `price - exchangeRebate`. Cart UI shows a small "with exchange" tag on the line item. Order insert keeps the unit price actually charged.

---

## 5. Admin

In the product edit form (admin panel — existing or upcoming), expose:
- `has_exchange` (toggle)
- `exchange_rebate` (number)

So staff can set the rebate per battery model.

---

## Files to change

- **DB migration**: add `exchange_rebate`, `has_exchange` to `products`; backfill defaults.
- `src/types/catalog.ts` — add the two fields.
- `src/components/products/ProductCard.tsx` — dual-price block.
- `src/pages/ProductDetail.tsx` — full rebuild (gallery, price card, pincode, exchange toggle, tabs, spec table).
- `src/hooks/useCart.tsx` — `withExchange` / `exchangeRebate` on cart lines.
- `src/pages/Cart.tsx` — show exchange tag and use effective unit price.
- `src/components/products/Gallery.tsx` *(new)* — thumbnail + main-image component with GSAP fade between thumbs.
- Admin product form — add the two new fields when we build/iterate the admin UI.

---

## Out of scope (this round)

- Real pincode serviceability database (UI stub only).
- Reviews tab data (placeholder).
- Image gallery uses `primary_image_url` + `product_images` table that already exists; if a product has only one image we just show that one.

Approve and I'll implement in build mode.
