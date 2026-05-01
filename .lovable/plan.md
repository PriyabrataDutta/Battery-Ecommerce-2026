
## What this changes

The inline JSON-LD block in the product detail page will be replaced with a dedicated builder function that validates every field against the admin-entered data, ensuring prices are never null/0, currency is always "INR", and availability always resolves to a valid schema.org URL.

## Files

### 1. Create `src/pages/product-detail/lib/buildProductJsonLd.ts`

A pure function `buildProductJsonLd(product, images, canonicalUrl)` that:

- Computes safe prices internally using the same logic already in `index.tsx` (price_without_exchange -> price fallback, price_with_exchange -> withoutExchange fallback)
- Uses a `safePrice()` helper that coerces null, undefined, NaN, negative, and 0 to a minimum of `0.01`
- Ensures `lowPrice <= highPrice` (swaps if inverted)
- Maps every admin field with these fallbacks:

| Field | Source (admin) | Fallback |
|---|---|---|
| name | `product.name` | Always required in DB |
| sku | `product.sku` | Omitted if empty |
| description | `meta_description` -> `short_description` | `"{name} battery"` |
| image | `product_images` + `primary_image_url` | `["/placeholder.svg"]` |
| brand | `battery_brands.name` | `"Kachi Batteries"` |
| category | `categories.name` | Omitted if empty |
| keywords | `tags[]` | Omitted if empty |
| capacity_ah | `capacity_ah` | Omitted if null/0 |
| warranty_months | `warranty_months` | Omitted if null/0 |
| price (offers) | Computed safe prices | Min `0.01` |
| priceCurrency | Hardcoded | `"INR"` |
| availability | `stock` | `OutOfStock` if null/NaN/<=0 |
| has_exchange | `has_exchange` | Only adds exchange offer when true AND exchange price < standard price |
| mrp | `mrp` | Used for highPrice only when > withoutExchange |

Returns the complete JSON-LD object ready for `JSON.stringify()`.

### 2. Edit `src/pages/product-detail/index.tsx`

- Import `buildProductJsonLd`
- Replace the ~75-line inline JSON-LD object (lines 140-215) with:
  ```tsx
  const jsonLd = useMemo(
    () => buildProductJsonLd(product, allImages, canonicalUrl),
    [product, allImages, canonicalUrl]
  );
  ```
- Render: `{jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}`
- Keep all existing OG meta tags and pricing logic unchanged (they're used by the UI too)
