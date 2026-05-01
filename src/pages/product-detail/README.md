# Product Detail

Single product page.

## Routes

`/product/:slug` (mounted in `src/App.tsx`).

## Files

```
product-detail/
├── index.tsx                page shell — fetches data, owns qty/exchange state
└── components/
    ├── ProductGallery.tsx   main image + thumbnails (with GSAP fade)
    ├── ProductInfo.tsx      brand · title · price · CTAs · pincode · trust
    ├── PriceBreakup.tsx     sticky right-column totals card
    ├── DetailsTabs.tsx      Details / Specs / Warranty / Delivery tabs
    ├── RelatedProducts.tsx  "you might also like" grid
    ├── MobileBottomBar.tsx  sticky Add-to-Cart bar on small screens
    ├── Trust.tsx            badge cell used in the trust strip
    ├── Row.tsx              label/value row used in the price breakup
    └── SpecRow.tsx          row used in the specs table
```

## Data dependencies

- `useProductBySlug(slug)`        — the product
- `useProductImages(productId)`   — gallery
- `useRelatedProducts(brandId, productId)` — recommendations

All three live in `src/hooks/queries/useProducts.ts` and call into
`src/api/products.ts` / `src/api/productImages.ts`.

## Common changes

| You want to…                                  | File to edit                  |
| --------------------------------------------- | ----------------------------- |
| Add a new tab (e.g. Reviews)                  | `components/DetailsTabs.tsx`  |
| Add a new row to the price breakup            | `components/PriceBreakup.tsx` |
| Change exchange-rebate UI                     | `components/ProductInfo.tsx`  |
| Show more than 5 thumbnails                   | `components/ProductGallery.tsx` (the `.slice(0, 5)`) |
| Wire pincode → real serviceability check      | `components/ProductInfo.tsx` (`handleCheckPin`) |
