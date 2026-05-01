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
    ├── totals.ts        subtotal → discount → tax → total math
    └── draft.ts         localStorage persistence (5-min TTL)
```

## Data dependencies

- `useCart()` — cart contents + subtotal
- `useDefaultAddress(userId)` — prefill on mount
- `useCreateOrder()` — write the order on submit

All other state is local — none of it is server-owned until the user
clicks "Place order".

## Common changes

| You want to…                              | File to edit                          |
| ----------------------------------------- | ------------------------------------- |
| Add a delivery method                     | `lib/constants.ts` (DELIVERY_OPTIONS + DELIVERY_LEAD_DAYS) |
| Add a payment method                      | `lib/constants.ts` + `lib/types.ts`   |
| Change the GST rate                       | `lib/constants.ts` (TAX_RATE)         |
| Add a promo code                          | `lib/constants.ts` (PROMO_CODES)      |
| Add a field to the address form           | `lib/types.ts` + `lib/validation.ts` + `components/AddressStep.tsx` |
| Change a slot's notes requirement         | `lib/constants.ts` (notesMin)         |
| Add a new step to the wizard              | `lib/constants.ts` (STEPS) + new component + render branch in `index.tsx` |
| Change how totals are calculated          | `lib/totals.ts`                       |
| Tweak draft expiry                        | `lib/constants.ts` (DRAFT_TTL_MS)     |
