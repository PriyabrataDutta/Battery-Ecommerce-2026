
## Rearrange Admin Dashboard Menu

Reorganize the admin sidebar from the current 3 sections into 5 sections that reflect how a battery e-commerce business actually operates day-to-day.

### Current layout
- **Catalog**: Dashboard, Products, Brands, Categories, Car Fitment, Media, Settings
- **Management**: Users, Orders, Quotes, Messages
- **Super Admin**: Audit Log

### Proposed layout

```text
─── Overview ───────────────
  Dashboard

─── E-Commerce ─────────────
  Orders
  Quotes
  Messages

─── Product Catalog ────────
  Products
  Brands
  Categories
  Car Fitment

─── Content & Media ────────
  Media

─── Administration ─────────
  Users
  Settings
  Audit Log
```

**Rationale:**
- **Overview** — the dashboard is the landing page, stands alone at the top for quick glance.
- **E-Commerce** — orders, quotes, and messages are the daily operational items a battery shop owner checks first. Grouped together for fast access.
- **Product Catalog** — products, brands, categories, and fitment are inventory/catalog management tasks done less frequently.
- **Content & Media** — media gallery for managing images/files.
- **Administration** — users, settings, and audit log are admin-level tasks, grouped at the bottom.

### Technical changes

**File: `src/pages/admin/_lib/tabs.ts`**
- Add two new section keys: `"overview"` and `"content"`
- Update `section` field on each tab definition to match the new grouping
- Reorder `ADMIN_TAB_DEFS` array so items appear in the correct visual order
- Update `SIDEBAR_SECTIONS` array with new labels and keys
- Update the `AdminTabDef` type to include the new section keys

No database changes needed. No new components.
