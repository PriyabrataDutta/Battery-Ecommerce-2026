# Kachi Batteries — Go-Live Checklist

Legend: [x] done · [~] partial · [ ] pending

## 1. Storefront
- [x] Home (hero, car-brand grid, categories, bestsellers/new tabs, testimonials, delivery highlights, sticky mobile CTA)
- [x] Shop with filters (brand, category, car fitment, in-stock counts) + pagination (20/page)
- [x] Category, Brand, Brands listing pages
- [x] Product detail (gallery, specs, related, JSON-LD, reviews tab)
- [x] Search with vehicle (car brand + model) selector
- [x] Blog listing + post, Catalog downloads, About, Contact, Quote (B2B), Jump-start
- [x] Cart + multi-step checkout (address, delivery slot, payment step, review)
- [x] Per-item GST calculation in totals and order summary
- [x] Order confirmation page with tracker
- [~] Static page content editable from admin (CMS) — only blog/catalog are DB-driven
- [ ] Real contact details (phone/WhatsApp currently placeholders)
- [ ] Real pincode serviceability check (currently UI only)

## 2. Customer accounts
- [x] Email/password sign-up & sign-in, phone login lookup, password reset
- [x] Phone verification gate before checkout/account
- [x] Account: overview, profile, addresses (default address), orders, wishlist, quotes, support, notifications
- [x] Product reviews with image upload (moderated)
- [x] Return requests with images (staff verify -> admin approve)
- [~] SMS provider for phone OTP — verify a real SMS gateway is configured
- [ ] Google sign-in (optional)

## 3. Payments (BLOCKER)
- [x] Payment gateway settings UI (Razorpay / PayU / Cashfree keys)
- [ ] Live payment capture: create-order + verify-signature backend function
- [ ] Payment webhook to mark orders `paid` / `failed`
- [ ] Refund flow tied to approved returns
- [ ] Cash on Delivery rules (limits / pincodes) if offered

## 4. Orders & fulfilment
- [x] Admin order list, detail drawer, status changes, notes
- [ ] Courier / shipping integration (Shiprocket, Delhivery etc.) and tracking numbers
- [ ] GST tax invoice PDF generation (GSTIN, HSN, CGST/SGST/IGST split)
- [ ] Inventory decrement on paid order + restock on cancel/return

## 5. Notifications & email
- [x] In-app realtime notifications (returns)
- [x] SMTP settings + test email, notification toggle grid
- [ ] Transactional emails actually sent: order placed, shipped, delivered, return updates
- [ ] Custom sender email domain verified

## 6. Admin panel
- [x] Dashboard KPIs & charts, audit log
- [x] Products (CRUD, bulk import, media, fitment, GST/HSN), Brands, Categories (HSN)
- [x] Orders, Returns, Reviews moderation, Quotes, Messages/Callbacks
- [x] Customers and Team separated; RBAC with per-tab permissions + presets
- [x] Settings: Payment, Email/SMTP, Notifications, GST slabs, Shipping, Security (change password)
- [x] Offers / promo codes
- [ ] CMS editor for Home/About/policy pages

## 7. Legal & compliance
- [ ] Privacy Policy, Terms, Refund/Return, Shipping, Cancellation pages with real content (required by payment gateways)
- [ ] Business GSTIN, registered address in footer and invoices
- [ ] Cookie / consent notice if running ads/analytics

## 8. SEO, analytics, security
- [x] Title/meta/OG tags, Organization/WebSite/Article JSON-LD, sitemap.xml, robots.txt
- [x] RLS on all tables, security-definer hardening, scoped storage buckets
- [ ] Connect Google Search Console and submit sitemap
- [ ] Analytics (GA4 / Meta pixel)
- [ ] Re-run security scan right before launch

## 9. Launch
- [ ] Load real product catalogue, prices, stock and images
- [ ] Create superadmin (see DEPLOYMENT.md) and remove test accounts/orders
- [ ] End-to-end test order with a real payment in live mode
- [ ] Connect custom domain and publish
