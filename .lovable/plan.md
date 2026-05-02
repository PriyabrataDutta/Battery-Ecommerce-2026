# Full Frontend Build: Pages, Reviews & Returns

This is a large effort split into three phases. We'll implement them sequentially.

---

## Phase 1 — Polish Frontend Pages

### 1.1 Blog Page (real listing)

- Query `blog_posts` table and render a grid of published posts with cover image, title, excerpt, and date.
- Add a `/blog/:slug` detail page that renders the full post body.
- Add routes in `App.tsx`.

### 1.2 Catalog Page (PDF downloads)

- Query `catalog_files` table and display a card grid with title, description, category badge, file size, and a download link.
- Replace the "coming soon" placeholder.

### 1.3 Brands Page (with logos)

- Show brand logos (from `logo_url`) instead of plain text cards.
- Add product count badges per brand.

### 1.4 Wishlist (functional)

- Query `wishlist_items` joined with `products` to show saved products.
- Add/remove toggle on `ProductCard` and product detail page (heart icon).
- Replace the "coming soon" placeholder in Account.

### 1.5 Account Quotes (functional)

- Query `quote_requests` filtered by user email.
- Show status, date, and requirement excerpt.
- Replace the "coming soon" placeholder.

### 1.6 Account Support (functional)

- Query `contact_messages` + `callback_requests` by user email/phone.
- Show status and date.
- Replace the "coming soon" placeholder.

### 1.7 About Page (richer content)

- Add sections: Mission, Team, Why Choose Us with icons/stats.
- Use existing Kachi brand copy and imagery.  
  
All this thing should fetch from the backend. to be precise A CMS system to edit the pages.

---

## Phase 2 — Product Review System

### Database

- New `product_reviews` table: `id`, `product_id`, `user_id`, `rating` (1-5), `title`, `body`, `status` (pending/approved/rejected), `created_at`, `updated_at`.
- New `review_images` table: `id`, `review_id`, `url`, `sort_order`.
- Storage bucket `review-images` (public).
- RLS: public read (approved only), authenticated insert (own), staff manage all.

### Frontend — Customer

- "Reviews" tab added to `DetailsTabs` on the product page.
- Star rating display, review list with customer name, date, images.
- "Write a Review" button: if not logged in, redirect to `/auth` with return URL. If logged in, open a form with star picker, title, body, and image upload (up to 3 images).
- Average rating + count shown on `ProductInfo` and `ProductCard`.

### Frontend — Admin

- New "Reviews" admin tab to moderate reviews (approve/reject).
- Filter by status, product.

---

## Phase 3 — Product Return Module

### Database

- New `return_requests` table: `id`, `order_id`, `order_item_id`, `user_id`, `reason`, `description`, `status` (requested/staff_verified/admin_approved/rejected/completed), `created_at`, `updated_at`.
- New `return_images` table: `id`, `return_id`, `url`.
- Storage bucket `return-images` (private).
- RLS: user reads/creates own, staff can read + update status, admin can do all.

### Workflow

1. Customer initiates return from Account > Orders (within return window).
2. Staff reviews and verifies (marks `staff_verified`).
3. Admin approves/rejects. Super-admin can bypass staff step.
4. Status updates trigger in-app notifications.

### Notifications

- New `notifications` table: `id`, `user_id`, `type`, `title`, `message`, `is_read`, `link`, `created_at`.
- Database trigger on `return_requests` status change inserts notifications for: the customer, all staff, and all admins.
- Bell icon in header with unread count badge.
- Notification dropdown/page in Account.

### Frontend — Customer

- "Request Return" button on order items (if eligible).
- Return form: reason dropdown, description, image upload.
- Return status tracker in Account > Orders.

### Frontend — Admin

- New "Returns" admin tab with status filters.
- Detail drawer showing return info, images, verification controls.
- Staff sees "Verify" button; Admin sees "Approve/Reject" buttons.

---

## Technical Notes

- All new tables get proper RLS policies following existing patterns (`is_staff`, `has_role`).
- Image uploads use `ImageUpload` component pattern already in the codebase.
- Admin tabs registered in `dashboardTabs.ts` and `AdminLayout`.
- Account tabs registered in `dashboardTabs.ts` and `AccountLayout`.
- Notifications use Supabase Realtime for live updates.

We'll start with **Phase 1** immediately after approval.