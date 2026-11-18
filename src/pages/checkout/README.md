# Checkout

Multi-step purchase wizard: **Address → Delivery → Payment → Review →
place order**.

## Routes

`/checkout` (mounted in `src/App.tsx`, gated by `<RequirePhoneVerified />`).

## Files

```
checkout/
├── index.tsx            page shell — owns wizard state, calls placeOrder
├── components/
│   ├── AddressStep.tsx  shipping form
│   ├── DeliveryStep.tsx method + date + slot
│   ├── PaymentStep.tsx  payment method picker (demo)
│   ├── ReviewStep.tsx   read-only summary
│   ├── OrderSummary.tsx sticky right sidebar
│   ├── PromoInput.tsx   promo code apply/remove
│   ├── Field.tsx        labelled input wrapper
│   └── ReviewBlock.tsx  bordered section in ReviewStep
└── lib/
    ├── constants.ts     delivery/payment/slot/promo data + date helpers
    ├── types.ts         shared TS types
    ├── validation.ts    zod schema + schedule validator
    └── draft.ts         localStorage persistence (5-min TTL)
```

## Data dependencies

- `useCart()` — cart contents + subtotal
- `useDefaultAddress(userId)` — prefill on mount
- `useOrderQuote()` — server price quote (`quote_order` RPC)
- `usePlaceOrder()` — place the order (`place_order` RPC; prices, promo, GST, stock all server-side)

All other state is local — none of it is server-owned until the user
clicks "Place order".

## Common changes

| You want to…                              | File to edit                          |
| ----------------------------------------- | ------------------------------------- |
| Add a delivery method                     | `lib/constants.ts` (DELIVERY_OPTIONS + DELIVERY_LEAD_DAYS) |
| Add a payment method                      | `lib/constants.ts` + `lib/types.ts`   |
| Change a product's GST rate               | Admin → Products (GST rate)           |
| Add a promo code                          | `offers` table                        |
| Add a field to the address form           | `lib/types.ts` + `lib/validation.ts` + `components/AddressStep.tsx` |
| Change a slot's notes requirement         | `lib/constants.ts` (notesMin)         |
| Add a new step to the wizard              | `lib/constants.ts` (STEPS) + new component + render branch in `index.tsx` |
| Change how totals are calculated          | `_price_order` SQL function           |
| Tweak draft expiry                        | `lib/constants.ts` (DRAFT_TTL_MS)     |

## Online payment (Cashfree)

1. `place_order` (payment `online`) creates the order and reserves stock.
2. `payOnline()` (`src/lib/cashfree.ts`) calls the `cashfree-order` edge function
   (`create`) and opens Cashfree's hosted checkout (SDK loaded from Cashfree's CDN).
3. Cashfree returns to `/order-confirmation?order=KCH-…`; `PaymentStatusBanner`
   calls `cashfree-order` (`verify`), which re-reads the order from Cashfree.
4. `cashfree-webhook` (signature-checked) does the same in the background.
   Only `mark_order_paid` (service role) sets `payment_status = 'paid'`.
5. Unpaid online orders are cancelled and restocked after 30 minutes
   (`expire_unpaid_online_orders`, pg_cron every 5 min).

Methods, mode and keys: Admin → Settings → Payment.
