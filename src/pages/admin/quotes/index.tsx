import { useState } from "react";
import { QuotesToolbar, type QuotesFilterState } from "./components/QuotesToolbar";
import { QuotesTable } from "./components/QuotesTable";
import { QuoteDetailDrawer } from "./components/QuoteDetailDrawer";
import { useAdminQuotesQuery } from "./hooks/useAdminQuotes";
import type { AdminQuoteRow } from "@/api/admin/quotes";

/**
 * AdminQuotes (orchestrator)
 * ==============================================================
 * Triage view for `quote_requests`. Read-only details + status
 * change. The submission form lives in the public Quote page
 * (`src/pages/Quote.tsx`).
 */
const AdminQuotes = () => {
  const [filters, setFilters] = useState<QuotesFilterState>({ search: "", status: "" });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<AdminQuoteRow | null>(null);
  const q = useAdminQuotesQuery({
    search: filters.search || undefined,
    status: filters.status || undefined,
  });
  const liveActive = active ? q.data?.find((r) => r.id === active.id) ?? active : null;

  return (
    <div className="space-y-3">
      <QuotesToolbar state={filters} onChange={setFilters} count={q.data?.length ?? 0} />
      <QuotesTable
        rows={q.data ?? []}
        loading={q.isLoading}
        onRowClick={(row) => {
          setActive(row);
          setOpen(true);
        }}
      />
      <QuoteDetailDrawer open={open} onOpenChange={setOpen} quote={liveActive} />
    </div>
  );
};

export default AdminQuotes;
