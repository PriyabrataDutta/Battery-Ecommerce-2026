
# Product Page Restructure — Performance, Architecture, Security

## Problems Found

1. **3 waterfall queries**: product loads first, then images + related fire only after product resolves (sequential, not parallel)
2. **No query caching**: `useProductBySlug`, `useProductImages`, `useRelatedProducts` have no `staleTime` — every navigation re-fetches
3. **High CLS (0.28)**: footer shifts layout as images/data load; no skeleton/placeholder sizing
4. **Below-fold content eagerly rendered**: DetailsTabs, RelatedProducts render immediately even though they're off-screen
5. **Dead component**: `PriceBreakup.tsx` and `Row.tsx` are unused (replaced by inline pricing cards)
6. **No SEO meta tags**: product pages lack `<title>`, `<meta description>`, Open Graph tags
7. **Console warnings**: React ref warnings on DetailsTabs, RelatedProducts, MobileBottomBar (harmless but noisy)
8. **`formatINR` creates a new `Intl.NumberFormat` on every call** — minor but easily cached
9. **Gallery images not lazy-loaded**: thumbnails and main image load eagerly without `loading="lazy"`
10. **GSAP imported for a simple fade** — heavyweight dependency for a single opacity animation

---

## Plan

### 1. Eliminate query waterfall — single combined query

Refactor `getProductBySlug` to also select `product_images(id, url, alt, sort_order)` in the same Supabase join. This removes the separate `useProductImages` call entirely — one query returns product + brand + category + images.

Related products will remain a separate query but fire immediately using `brand_id` from the URL-prefetched product (no change needed since it already uses `enabled`).

### 2. Add query caching

Add `staleTime: 5 * 60_000` (5 minutes) to `useProductBySlug` and `useRelatedProducts`. Product data rarely changes — this prevents re-fetching on back-navigation.

### 3. Fix CLS with skeleton loading

Replace the plain "Loading..." text with a skeleton layout that reserves the exact 2-column space (aspect-square gallery placeholder + info column placeholder). This eliminates the 0.27 CLS from the footer shifting.

### 4. Lazy-load below-fold sections

Wrap `DetailsTabs` and `RelatedProducts` in `React.lazy` with `Suspense`, or use an intersection observer to defer rendering until the user scrolls near them. This reduces initial render work.

### 5. Add SEO head tags

Install `react-helmet-async` (or use the existing one if present) to inject per-product `<title>`, `<meta name="description">`, and Open Graph tags (`og:title`, `og:image`, `og:price:amount`, `og:price:currency`). Use product name, short_description, and primary_image_url.

### 6. Replace GSAP with CSS transition

Remove the GSAP import from `ProductGallery.tsx` and use a simple CSS `transition: opacity 0.3s` on the main image. This eliminates ~15KB of JS for a single fade effect.

### 7. Cache `Intl.NumberFormat` instance

Create the formatter once at module level in `format.ts` instead of constructing it on every `formatINR()` call.

### 8. Delete dead components

Remove `PriceBreakup.tsx` and `Row.tsx` — they are no longer used anywhere.

### 9. Add `loading="lazy"` to gallery thumbnails

The main image should load eagerly (LCP element), but thumbnails and related product images should use `loading="lazy"`.

### 10. Fix React ref console warnings

The warnings come from React's strict mode trying to pass refs to function components. Since no explicit refs are passed in `index.tsx`, this is likely caused by an animation library or React Router. Will investigate and suppress or fix with `forwardRef` where needed.

---

## Technical Details

**Files to create:**
- `src/pages/product-detail/components/ProductSkeleton.tsx` — skeleton loading state

**Files to edit:**
- `src/api/products.ts` — join `product_images` in `getProductBySlug`
- `src/hooks/queries/useProducts.ts` — add `staleTime`, remove `useProductImages` dependency
- `src/pages/product-detail/index.tsx` — use skeleton, lazy sections, remove `useProductImages` import, simplified image handling
- `src/pages/product-detail/components/ProductGallery.tsx` — remove GSAP, CSS transition, lazy thumbnails
- `src/lib/format.ts` — cache NumberFormat instance
- `src/pages/product-detail/components/ProductInfo.tsx` — add SEO head tags via react-helmet-async

**Files to delete:**
- `src/pages/product-detail/components/PriceBreakup.tsx`
- `src/pages/product-detail/components/Row.tsx`

**Dependencies:**
- Add `react-helmet-async`
- No new backend changes needed

**Estimated impact:**
- 1 network request instead of 3 on page load
- ~5KB less JS (GSAP removal from this route)
- CLS drops from 0.28 to near 0
- Back-navigation is instant (cached data)
- SEO-ready with structured meta tags
