
# Kachi Batteries — eCommerce Build Plan

A modern storefront for car batteries, inverter batteries and UPS, with B2B quote flow, fitment-based search, full admin, cart and online checkout. Layout language inspired by batteryboss.in; brand identity 100% Kachi (red / black / white / gray).

## Brand & Design System

- **Theme:** Industrial Charcoal — white surfaces, charcoal text, red logo accent.
  - Page bg `#f5f5f5`, surface `#ffffff`
  - Ink `#0d0d0d`, muted `#3a3a3a`
  - Accent red `#c8102e` (Kachi logo red)
- **Typography:** Bold display for headings (Oswald-style), Inter for body.
- **Visual language:** White cards, subtle 1px borders, sharp small radius, strong line icons, red CTA buttons, badges (NEW, SALE, BESTSELLER).
- **Animation:** GSAP + ScrollTrigger — hero text reveal, floating product cut-outs in hero, scroll-fade for sections, marquee brand strip, micro-hover on cards. Lazy-loaded for fast first paint.
- **Logo:** Provided Kachi Batteries logo in header + footer.

## Site Map

```text
/                       Home
/shop                   Shop (filters + fitment)
/category/:slug         Category pages
/brand/:slug            Battery brand pages
/product/:slug          Product detail
/jump-start             Jump-start service
/inverter-batteries     Inverter landing
/quote                  Request a Quote (B2B)
/catalog                Catalog / Price-list downloads
/blog                   Blog list
/blog/:slug             Blog post
/about                  About Us
/contact                Contact
/cart                   Cart
/checkout               Checkout (Stripe)
/order/success          Confirmation
/auth                   Sign in / Sign up
/account                Order history
/unsubscribe            Email unsubscribe
/admin/*                Admin panel (role-protected)
```

## Top Bar & Navigation

- **Utility bar:** phone, WhatsApp, "Have a Question?" link, account, cart count.
- **Header:** Logo · big search bar · Account · Cart.
- **Main menu:** Home · Shop ▾ (mega) · Brands · Jump Start · Blog · About · Contact · Support · **Clearance Sale** (red).
- **Hero CTA:** prominent **Request Call Back** button (BatteryBoss-style).
- **Mega menu (Shop):**
  - Car Batteries (by capacity, by use)
  - Inverter Batteries & UPS
  - Battery by Brand: Amaron, Exide, Elito, Power Zone
  - Offers: On Sale, Clearance

## Home Page (BatteryBoss-inspired layout)

1. **Cinematic hero** — full-bleed automotive image, big headline "Best Prices · Free Shipping · Free Installation", floating cut-out battery products on the right (GSAP parallax). Primary CTA **Request Call Back**, secondary **Shop Now**.
2. **Fitment search card** (overlapping the hero, white elevated card):
   - Tabs: **Car Battery** (default) / **Inverter Battery**
   - Car Battery → Car Brand → Car Model → "Find My Battery" → routes to `/shop?car_brand=…&car_model=…`
   - Inverter Battery → Capacity (Ah) + Use Case → results
   - Optional Battery Brand filter
3. **Perks strip** — Best Prices · Free Shipping · Free Installation · Genuine Warranty (icons).
4. **Shop by Category** — 6 cards: Car Battery · Inverter Battery · By Battery Brand · By Car Brand · Sale · Offers.
5. **Shop by Brand** — logo marquee linking to brand pages.
6. **Featured Products tabs** — Featured · Best Sellers · New Arrivals · On Sale.
7. **B2B Trust** — 4 icon cards: Genuine Products · Competitive Pricing · Fast Dispatch · Technical Support.
8. **Industries We Serve** — grid of 6.
9. **Quick Quote** form — Name, Company, Phone, Email, Requirement, BOQ upload, Submit.
10. **Blog/Guides** — 3 latest posts.
11. **Footer** — sitemap, payment icons, social, address, certifications.

Sticky **WhatsApp** floating CTA + side **"Have a Question?"** tab on every page.

## Shop Page

- Sidebar filters:
  - **Module 1 — Fitment:** Product type · Car Brand · Car Model · Price slider
  - **Module 2 — Battery Brand:** dynamic from data
  - Capacity (Ah), Warranty, Stock
- Top bar: result count, sort (popularity / newest / price / rating), grid/list, Clear filters.
- Product cards: image, badges, name, SKU, price, Add to Cart + Request Quote.
- Pagination.

## Product Detail

- Image gallery (3–5) with zoom/lightbox.
- Title pattern: Brand + Series + Capacity + Type.
- Price, MRP strikethrough, savings, stock, warranty.
- Quantity, Add to Cart, Request Quote, WhatsApp Enquiry.
- Tabs: Description · Specs · Fitment (compatible cars) · Warranty · Reviews.
- Trust badges row.
- Related products (same category + same brand).

## Cart & Checkout

- Cart drawer + dedicated `/cart`.
- Checkout: address, contact, order summary → **Stripe** (Lovable's built-in Stripe Payments — no account setup needed; Pro plan required).
- Confirmation page + order email receipt.
- B2B "Request Quote" items take a parallel flow (no payment).

## Admin Panel (`/admin`, admin/staff role)

- **Dashboard** — orders today, revenue, low stock, pending quotes, callback requests.
- **Products** — CRUD, image upload, badges, pricing, stock, brand, category, **fitment (car brand + model multi-select)**, specs.
- **Bulk Upload (Phase 2)** — CSV import with auto car-brand/model mapping.
- **Categories** · **Battery Brands** · **Car Brands & Models** (drives the fitment selectors).
- **Orders** — list, status, invoices.
- **Quote Requests** · **Callback Requests** · **Contact Submissions** — inboxes with status.
- **Catalogs** — upload PDFs for the download page.
- **Blog** — posts CRUD with rich text.
- **Users & Roles** — promote admin/staff.

## Other Pages

- **Brands** — index of battery brands.
- **Jump Start** — service explainer + booking form.
- **Inverter Batteries** — category landing.
- **Catalog** — list of downloadable PDFs.
- **Blog list/post** — admin-driven.
- **About / Contact** — content + contact form (lands in admin + sends confirmation email).

## Email Notifications (transactional)

- Quote request received (to customer) + admin alert.
- Callback request received (to customer) + admin alert.
- Contact form confirmation.
- Order confirmation + payment receipt.

---

## Technical Section

### Stack
- React + Vite + Tailwind + shadcn/ui (existing).
- React Router (existing).
- **Lovable Cloud** (DB, auth, storage, edge functions).
- **GSAP** + ScrollTrigger.
- **Stripe** via Lovable's built-in Stripe Payments.
- **Lovable email** (transactional) for confirmations.
- **Zod + react-hook-form** for all forms (validated client + edge function).
- React Query for data fetching.

### Data Model

```text
profiles(id→auth.users, full_name, company, phone)
user_roles(user_id, role: admin|staff|customer)   -- separate table, has_role() SECURITY DEFINER
battery_brands(id, name, slug, logo_url, description)
car_brands(id, name, slug, logo_url)
car_models(id, car_brand_id, name, slug, years)
categories(id, name, slug, parent_id, image_url, icon)
products(id, sku, name, slug, brand_id, category_id, price, mrp,
         stock, warranty_months, capacity_ah, description,
         specs jsonb, badges text[], is_featured, is_bestseller,
         is_new, is_on_sale, status)
product_images(id, product_id, url, sort_order)
product_fitment(product_id, car_model_id)         -- many-to-many
orders(id, user_id, status, subtotal, tax, total, address jsonb,
       stripe_session_id, created_at)
order_items(id, order_id, product_id, qty, unit_price)
quote_requests(id, name, company, phone, email, requirement,
               boq_file_url, status, created_at)
callback_requests(id, name, phone, preferred_time, status, created_at)
contact_messages(id, name, email, phone, message, created_at)
catalog_files(id, title, file_url, category, created_at)
blog_posts(id, title, slug, cover_url, excerpt, body, author_id,
           published_at)
```

- **RLS** on every table; `has_role()` SECURITY DEFINER for admin checks.
- **Storage buckets:** `product-images`, `brand-logos`, `catalogs`, `blog`, `quote-uploads`.

### Edge Functions
- `create-checkout` — Stripe checkout session.
- `stripe-webhook` — mark orders paid.
- `submit-quote`, `submit-callback`, `submit-contact` — validate + persist + trigger email.
- `send-transactional-email` (scaffolded) for confirmations.

### Performance
- Code-split routes; lazy-load admin and checkout bundles.
- Responsive lazy images from Cloud storage.
- GSAP + ScrollTrigger loaded only where used.
- React Query caching for catalog data.

### Phasing

**Phase 1 (this build):**
- Theme + design system + header/footer + GSAP setup
- DB schema + RLS + seed data (brands, car brands/models, sample products)
- Home (with cinematic hero + fitment card), Shop, Product, Category, Brand pages
- Fitment search end-to-end
- Cart + Stripe checkout
- Auth + customer account
- Quote, Callback, Contact forms with email confirmations
- Admin: products, categories, brands, car brands/models, orders, quotes, callbacks, contact

**Phase 2 (after approval):**
- Bulk CSV product upload with auto fitment mapping
- Blog (admin + public) and Catalog downloads page
- Jump Start, Inverter Batteries, About — full content polish
- Reviews & ratings, invoices

### From you later (non-blocking)
- Real product photos, brand logos, hero slides, catalog PDFs — placeholders used until provided.
- Confirmation to enable **Lovable Cloud** and **Stripe Payments** (Pro plan).
