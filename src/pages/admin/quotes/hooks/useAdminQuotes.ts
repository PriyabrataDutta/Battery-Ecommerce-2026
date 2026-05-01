import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminQuotes,
  setQuoteStatus,
  type RequestStatus,
} from "@/api/admin/quotes";

export const ADMIN_QUOTES_KEY = ["admin", "quotes"] as const;

export function useAdminQuotesQuery(opts: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...ADMIN_QUOTES_KEY, opts],
    queryFn: () => listAdminQuotes(opts),
    staleTime: 10_000,
  });
}

export function useSetQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, prev }: { id: string; status: RequestStatus; prev: string }) =>
      setQuoteStatus(id, status, prev),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ADMIN_QUOTES_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update status"),
  });
}
