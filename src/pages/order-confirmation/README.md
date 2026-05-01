# Order Confirmation

Post-checkout "thank you" page rendered at `/order-confirmation`. Reads a
snapshot of the just-placed order from `sessionStorage` (written by the
Checkout flow) and displays it in a celebratory, printable layout.

## File map

```
order-confirmation/
├── index.tsx                     Orchestrator. Loads the snapshot + composes pieces.
├── hooks/
│   └── useSavedOrder.ts          Reads sessionStorage["kachi_last_order"].
├── lib/
│   └── types.ts                  SavedOrder shape + storage key constant.
├── components/
│   ├── SuccessHeader.tsx         Hero, order #, "Continue shopping" / "Print receipt".
│   ├── OrderTracker.tsx          3-step status strip + scheduled-slot banner.
│   ├── OrderItems.tsx            Line items list with image, SKU, qty, prices.
│   ├── AddressBlocks.tsx         Shipping address + contact info.
│   └── PaymentSummary.tsx        Right-rail card with totals + promo recap.
└── README.md                     (this file)
```

## Data flow

```
Checkout (src/pages/checkout/index.tsx)
  └── sessionStorage["kachi_last_order"] = SavedOrder
                  │
                  ▼
OrderConfirmation (this folder)
  └── useSavedOrder()  →  undefined | null | SavedOrder
        │  undefined → "Loading…"
        │  null      → <Navigate to="/" />
        └── SavedOrder
              ├── <SuccessHeader />
              ├── <OrderTracker />
              ├── <OrderItems />
              ├── <AddressBlocks />
              └── <PaymentSummary />
```

The page is intentionally self-contained — it does NOT call the API or
React Query. The Checkout flow is the single writer; this page is the
single reader.

## How do I…

| Task | Edit |
| --- | --- |
| Add a new field to the saved order | `lib/types.ts` (and the writer in `src/pages/checkout/index.tsx`) |
| Add a 4th step to the tracker | `components/OrderTracker.tsx` (extend grid + add `<Step />`) |
| Show extra address fields | `components/AddressBlocks.tsx` |
| Change the totals breakdown | `components/PaymentSummary.tsx` |
| Move from sessionStorage to the API | Replace `useSavedOrder()` with a React Query hook (e.g. `useOrderById(id)`). Keep the return tri-state (`undefined \| null \| SavedOrder`) so the page stays unchanged. |

## Conventions

- Use semantic tokens only (`text-ink`, `bg-success/10`, `border-line`).
- Page is print-friendly: the "Print receipt" button calls `window.print()`.
- Keep sub-components presentational — they receive typed slices of
  `SavedOrder` and never read storage themselves.
