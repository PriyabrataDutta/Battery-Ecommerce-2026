# Admin · Quotes

Triage view for `quote_requests` (B2B leads).

## Files
- `index.tsx` — orchestrator
- `components/QuotesToolbar.tsx` — search + status filter
- `components/QuotesTable.tsx` — list view
- `components/QuoteDetailDrawer.tsx` — full request + status change
- `hooks/useAdminQuotes.ts` — React Query hooks

## Add a new request status
1. Add the value to the `request_status` Postgres enum (migration).
2. Add it to `REQUEST_STATUSES` in `src/api/admin/quotes.ts`.
3. Optionally add a tone in `src/components/admin/StatusBadge.tsx`.
