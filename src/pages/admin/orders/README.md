# Admin · Orders

Order management UI for the admin dashboard. Mirrors the structure of
`pages/admin/products/`.

## File map

```
orders/
├── index.tsx                       Orchestrator. Owns filter + drawer state.
├── components/
│   ├── OrdersToolbar.tsx           Search + status filter row.
│   ├── OrdersTable.tsx             List view, click row to open the drawer.
│   └── OrderDetailDrawer.tsx       Customer/shipping info, items, totals,
│                                   status change + internal notes editing.
├── hooks/
│   └── useAdminOrders.ts           React Query hooks + status/notes mutations.
└── README.md                       (this file)
```

## Data flow

```
AdminLayout (panel = "orders")
  └── <AdminOrders />              ← index.tsx
        │  filters state ───────► useAdminOrdersQuery(filters)
        │                            └── api/admin/orders.ts → listAdminOrders()
        │
        ├── <OrdersToolbar />      search + status select
        ├── <OrdersTable />        EntityTable wrapper, onRowClick → openDrawer
        └── <OrderDetailDrawer />  useAdminOrderItems / useSetOrderStatus / useSetOrderNotes
                                      └── api/admin/orders.ts (writes + admin_log audit)
```

The drawer reads its `order` prop from `liveActive` — that's the freshest
copy of the row from the list query. So when the status mutation
invalidates `["admin", "orders"]` and the list re-fetches, the drawer
automatically reflects the new status without being remounted.

## How do I…

| Task | Edit |
| --- | --- |
| Add a column | `components/OrdersTable.tsx` (extend `columns` array). |
| Add a filter | `OrdersToolbar.tsx` + extend `ListAdminOrdersOptions` in `api/admin/orders.ts`. |
| Add a new status | Append to `ORDER_STATUSES` in `api/admin/orders.ts`. Add a tone in `components/admin/StatusBadge.tsx` for color. |
| Add a per-order action (e.g. "Refund") | Add a mutation in `useAdminOrders.ts` + the corresponding API function in `api/admin/orders.ts`, then wire a button in `OrderDetailDrawer.tsx`. |
| Show an order on a customer-facing page | Re-use `api/orders.ts` (customer side) — never import `api/admin/*` from public pages. |

## Conventions

- Status mutations always pass `prev` so the audit log records both old and new values.
- `internal notes` are staff-only — we never expose them to customers.
- Use `StatusBadge` for read-only status display and the `<Select />` only inside the drawer for changes.
