# Admin · Products

Catalog management UI for the admin dashboard. Follows the same
"thin orchestrator + dumb pieces + co-located hooks/lib" convention used
by Checkout / Order Confirmation.

## File map

```
products/
├── index.tsx                       Orchestrator. Owns filter + drawer state.
├── components/
│   ├── ProductsToolbar.tsx         Search + status/brand/category/stock filters + "New" button.
│   ├── ProductsTable.tsx           List view, columns defined here. Click row to edit.
│   └── ProductEditor.tsx           Create / edit drawer (sectioned form).
├── hooks/
│   └── useAdminProducts.ts         React Query hooks (list + create/update/delete mutations).
├── lib/
│   └── constants.ts                EMPTY_PRODUCT + PRODUCT_STATUSES.
└── README.md                       (this file)
```

## Data flow

```
AdminLayout (panel = "products")
  └── <AdminProducts />              ← index.tsx
        │  filters state ──────────► useAdminProductsQuery(filters)
        │                              └── api/admin/products.ts → listAdminProducts()
        │
        ├── <ProductsToolbar />      filter inputs + brand/category options
        ├── <ProductsTable />        EntityTable wrapper, onRowClick → openEdit
        └── <ProductEditor />        useCreateProduct / useUpdateProduct / useDeleteProduct
                                       └── api/admin/products.ts (writes + admin_log audit)
```

All Supabase reads/writes live in `src/api/admin/products.ts` — components
only call the React Query hooks. Each mutation auto-invalidates
`["admin", "products"]` so the table refreshes.

## How do I…

| Task | Edit |
| --- | --- |
| Add a list column | `components/ProductsTable.tsx` (extend `columns` array). |
| Add a filter chip | `ProductsToolbar.tsx` + extend `ListAdminProductsOptions` in `api/admin/products.ts`. |
| Add an editable field | Extend `ProductEditableFields` in `api/admin/products.ts`, then add a `<Field />` inside `ProductEditor.tsx`. |
| Add stricter validation | Create `lib/validation.ts` with a Zod schema (see `pages/checkout/lib/validation.ts`) and call it from `handleSave`. |
| Wire a real image uploader | Replace the URL input in the "Media" section with `<ImageUpload />` from `components/admin/`. |
| Bulk actions (e.g. archive) | Add row-level checkbox state in `index.tsx`, expose `useUpdateProduct` in a loop, wrap in `Promise.all`. |

## Conventions

- Use semantic tokens only (`text-warning`, `bg-card`, `border-line`).
- Mutations live in `useAdminProducts.ts`, never inside components.
- Audit logging happens server-side — every mutation in `api/admin/products.ts`
  calls `logActivity()` so the activity table records the change.
