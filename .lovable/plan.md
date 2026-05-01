## Website Audit Report — Speed, Security, UI/UX

I tested `/shop` and `/product/amaron-pro-65ah` in the live preview, ran a security scan on the backend, and reviewed the code. Below are real findings (not generic advice) plus a fix plan.

---

### 1) UI/UX Glitches (highest user impact)

**A. Floating "HAVE A QUESTION?" tab overlaps content**
On the product page, the right-edge vertical CTA covers the price card — the values `₹6,499` and `₹1,500` are clipped. Visible at 1202px viewport, worse on smaller screens.
Fix: in `src/components/layout/FloatingCTAs.tsx`, move the tab so it does not overlap the right column (offset further from the edge, hide on `<lg`, or add `pr-12` to the price card / push it inside a container with right padding on product pages).

**B. Product card images render as broken alt text**
On `/shop`, the BESTSELLER product cards show the alt text ("Amaron CR-150 Tall Tubular", "Exide Mileage 70Ah Car Battery") instead of an image — the image URLs are missing/404. The first card shows a stock laptop photo (clearly wrong for a battery).
Fix: audit `getProductImage()` in `src/lib/productImage.ts` and the `image_url` column in `products`. Add a proper placeholder battery SVG fallback in `ProductCard.tsx` so broken URLs never show raw alt text.

**C. React "Function components cannot be given refs" warning (3x on every product page)**
Console warning from `ProductDetail.tsx:1194` (the inline `Row` component) and `ProductCard.tsx`. `Row` is a plain function component but something is passing it a `ref`. Likely a `motion()` / GSAP wrapper or a Tabs child cloning props.
Fix: wrap `Row`, `SpecRow`, and `ProductCard` in `React.forwardRef` (or stop forwarding refs from the parent).

**D. Layout shift on header (CLS contributors)**
4 layout shifts during load, mostly from the header search form and the Sort `<Select>` (`w-[180px]` → `w-[200px]` responsive jump). CLS = 0.0197 (still "good") but visibly janky.
Fix: reserve space for the search bar and sort with min-heights / fixed widths until hydration.

**E. Sort dropdown + view-mode toggles wrap awkwardly**
On the shop toolbar, the Sort label, dropdown, and grid/list toggle sit on the same row but the right toggles are pushed under the floating "HAVE A QUESTION?" tab.
Fix: same as A — keep the floating tab clear of the main content column.

---

### 2) Speed

Measured on `/shop` cold load (preview, dev mode):

- TTFB: 955 ms (fine)
- FCP: **6.92 s** (poor — target <1.8 s)
- DOMContentLoaded: 6.67 s
- 146 script requests, 1.7 MB JS transferred
- Heaviest deps: `recharts` (221 KB), `lucide-react` (159 KB), `react-day-picker` (106 KB)

Note: dev mode is always slower than production, but these specific issues will hurt prod too:

**Fix 1 — Remove unused heavy deps from initial bundle**
`recharts` is only used in the admin Dashboard but is being loaded on the public Shop page. Lazy-load it: `const Dashboard = lazy(() => import('./pages/admin/Dashboard'))` in `App.tsx`.
Same for `react-day-picker` (Calendar) and `AdminLogin`/`AdminLayout`.

**Fix 2 — Code-split routes**
Currently every page in `App.tsx` is a static import. Convert all `pages/admin/*`, `Checkout`, `OrderConfirmation`, `Quote`, `account/*` to `React.lazy` + `<Suspense>`.

**Fix 3 — Tree-shake `lucide-react`**
Import per-icon paths if bundle stays large after route splitting.

**Fix 4 — Image optimization**
Product images are served unoptimized. Add `loading="lazy"` (some already have it), `width`/`height` attributes (prevents CLS), and use Supabase Storage transformations (`?width=400&quality=75`) on the listing.

---

### 3) Security

The Lovable Cloud security scan returned **33 findings** (all warn-level, no errors). Key categories:

**A. Function search_path mutable** (multiple SECURITY DEFINER functions)
Add `SET search_path = public` to functions like `has_role`, `is_staff`, `is_admin_email`, `admin_log`, etc. Prevents schema-hijack attacks.

**B. RLS policies using `USING (true)` for INSERT/UPDATE/DELETE** (3 occurrences)
At least one table has a write policy allowing anyone (or any authenticated user) to write/modify. Need to identify which tables and tighten to `auth.uid() = user_id` or `has_role(auth.uid(), 'admin')`.

**C. Public storage buckets allow listing** (4 buckets)
Buckets are public-read AND allow listing the entire object list. Restrict the SELECT policy on `storage.objects` to specific path prefixes, or make buckets non-listable.

**D. SECURITY DEFINER functions executable by anon** (2 functions)
`REVOKE EXECUTE … FROM anon` on functions that shouldn't be public, or convert to SECURITY INVOKER.

**E. Auth hardening (recommended, not in scan):**
- Enable HIBP leaked-password check in Cloud → Users → Auth settings
- Confirm OTP expiry ≤ 1 hour

---

### Suggested fix order (smallest → biggest impact)

```text
1. UI: fix floating CTA overlap + broken product images          (~15 min)
2. UI: forwardRef on Row/SpecRow/ProductCard (clears 3 console errors)
3. Security: add SET search_path to all SECURITY DEFINER fns     (1 migration)
4. Security: tighten the 3 over-permissive RLS write policies
5. Security: restrict storage bucket SELECT/listing
6. Speed: lazy-load admin routes + Checkout (biggest perf win)
7. Speed: image lazy-loading + width/height + storage transforms
8. Security: enable HIBP password check
```

### What I will NOT touch without your say-so
- The 4 public storage buckets — restricting them may break currently-working image loads. I'll inspect first and tell you which bucket has what before changing policies.
- RLS write policies — same reason; I'll list the offending tables/policies and propose the new condition before writing the migration.

---

**Approve this plan to switch to build mode**, or tell me which subset to tackle first (e.g. "just the UI glitches" or "security only").