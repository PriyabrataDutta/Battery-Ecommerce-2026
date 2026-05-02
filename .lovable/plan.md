
## Enhanced RBAC + Separate Customer Management

Two improvements: (A) granular staff permissions, and (B) splitting the Users admin tab into two distinct sections — one for Customers and one for Staff/Admins — so the business owner doesn't mix up customer accounts with internal team accounts.

---

### A. Granular Staff Permissions

Currently `admin` and `staff` have identical access. This adds per-tab permission control for staff users.

#### Permission keys

| Key | Tab |
|---|---|
| `dashboard.view` | Sales Dashboard |
| `orders.manage` | Orders |
| `quotes.manage` | Quotes |
| `messages.manage` | Messages |
| `products.manage` | Products |
| `brands.manage` | Brands |
| `categories.manage` | Categories |
| `fitment.manage` | Car Fitment |
| `media.manage` | Media |
| `customers.view` | Customers |
| `users.manage` | Team (admin-only default) |
| `settings.manage` | Settings (admin-only default) |
| `audit_log.view` | Audit Log (admin-only default) |

**Admins bypass all checks.** Permissions only restrict `staff` users.

#### Database migration

1. **`staff_permissions` table** — `user_id` (not null, references auth.users on delete cascade), `permission` text, `granted_by` uuid, `created_at`, unique on `(user_id, permission)`. RLS: admins full access, staff self-read only.
2. **`has_permission()` function** — security definer, returns true if user is admin OR has a matching row in `staff_permissions`.

#### Frontend

- **`src/hooks/usePermissions.ts`** — fetches current user's permissions; admins auto-get all.
- **`src/pages/admin/_lib/tabs.ts`** — add `requiredPermission` to each tab def.
- **`src/components/admin/AdminSidebar.tsx`** — hide tabs the user can't access.
- **`src/pages/admin/AdminLayout.tsx`** — show "Access Denied" if user navigates to restricted tab.
- **`src/pages/admin/users/components/PermissionsEditor.tsx`** — checkbox grid for managing staff permissions (admin-only).

---

### B. Separate Customers from Team in Admin Panel

Currently, one "Users" tab mixes customers, staff, and admins together. This splits it into:

- **Customers** tab (under E-Commerce section) — shows only users with `customer` role. View contact info, order history link, phone verified status.
- **Team** tab (under Administration section) — shows only `admin` and `staff` users. Manage roles, permissions, invite new staff.

#### Changes

- **`src/stores/dashboardTabs.ts`** — add `"customers"` and rename `"users"` to `"team"` in ADMIN_TABS.
- **`src/pages/admin/_lib/tabs.ts`** — add Customers tab (section: `ecommerce`, permission: `customers.view`), rename Users to Team (section: `admin`, permission: `users.manage`).
- **`src/pages/admin/customers/index.tsx`** (new) — table of customer-role users pulled from `profiles` joined with role check; shows name, email (from a new lightweight RPC), phone, verified status, order count, created date.
- **`src/pages/admin/users/`** — filter to show only admin/staff roles; add permissions editor column.
- **New RPC `admin_list_customers()`** — returns profiles where the user's role is `customer`, joining auth.users for email. Security definer, staff-only.

#### Sidebar result

```
─── Overview ───────────────
  Dashboard

─── E-Commerce ─────────────
  Orders
  Quotes
  Messages
  Customers          ← NEW

─── Product Catalog ────────
  Products
  Brands
  Categories
  Car Fitment

─── Content & Media ────────
  Media

─── Administration ─────────
  Team               ← renamed from "Users"
  Settings
  Audit Log
```

---

### Summary of all file changes

| Action | File |
|---|---|
| Migration | `staff_permissions` table + `has_permission()` fn + `admin_list_customers()` RPC |
| New | `src/hooks/usePermissions.ts` |
| New | `src/pages/admin/customers/index.tsx` |
| New | `src/pages/admin/users/components/PermissionsEditor.tsx` |
| Edit | `src/stores/dashboardTabs.ts` — add `customers`, rename `users` → `team` |
| Edit | `src/pages/admin/_lib/tabs.ts` — new tabs, permissions field |
| Edit | `src/components/admin/AdminSidebar.tsx` — permission-based filtering |
| Edit | `src/pages/admin/AdminLayout.tsx` — access denied gate |
| Edit | `src/pages/admin/users/` — filter to staff/admin only, add permissions editor |

No existing customer-facing features are affected. No breaking changes to RLS on existing tables.
