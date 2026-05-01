# Common tasks (cookbook)

## Add a filter to the Shop page

1. Add the column / index in the database (migration) if needed.
2. Extend `ProductFilters` in `src/api/products.ts` and the WHERE clause
   in `listProducts`.
3. Add a filter component in `src/components/products/filters/`.
4. Render it from `ShopFilters`.
5. Read/write the URL param in `Shop.tsx`.

## Add an admin metric to the Dashboard

1. Add the SQL or aggregate in `src/api/admin/stats.ts`.
2. Add a hook in `src/hooks/queries/useAdminStats.ts` (create if missing)
   that wraps it.
3. Add a card under `src/pages/admin/dashboard/components/` and render it
   from `dashboard/index.tsx`.

## Add a new step to checkout

1. Add the step name to `STEPS` in `src/pages/checkout/lib/constants.ts`.
2. Create `src/pages/checkout/components/<Name>Step.tsx`.
3. Render it from the switch in `src/pages/checkout/index.tsx`.
4. Add validation rules in `src/pages/checkout/lib/validation.ts`.
5. If it needs persisted draft data, extend the `Draft` type in
   `lib/draft.ts`.

## Add a new product card variant

Don't fork `ProductCard.tsx`. Add a `variant` prop with `cva` so existing
usages keep working.

## Add a transactional email

1. Use the email scaffolding tools in chat — they generate the edge
   function and template.
2. Trigger from the relevant mutation hook's `onSuccess`, calling the
   edge function via `supabase.functions.invoke(...)` from `src/api/`.

## Add an external API call (e.g. shipping rates)

1. Create an edge function under `supabase/functions/<name>/index.ts`.
2. Store the API key as a Supabase secret (the chat tool can do this).
3. Add a wrapper in `src/api/shipping.ts` that invokes the function.
4. Add a React Query hook in `src/hooks/queries/`.
