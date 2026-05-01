import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listContactMessages,
  listCallbackRequests,
  setContactStatus,
  setCallbackStatus,
} from "@/api/admin/messages";
import type { RequestStatus } from "@/api/admin/quotes";

export const ADMIN_CONTACTS_KEY = ["admin", "contact-messages"] as const;
export const ADMIN_CALLBACKS_KEY = ["admin", "callback-requests"] as const;

export function useContactMessagesQuery(opts: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...ADMIN_CONTACTS_KEY, opts],
    queryFn: () => listContactMessages(opts),
    staleTime: 10_000,
  });
}

export function useCallbackRequestsQuery(opts: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...ADMIN_CALLBACKS_KEY, opts],
    queryFn: () => listCallbackRequests(opts),
    staleTime: 10_000,
  });
}

export function useSetContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, prev }: { id: string; status: RequestStatus; prev: string }) =>
      setContactStatus(id, status, prev),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ADMIN_CONTACTS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update status"),
  });
}

export function useSetCallbackStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, prev }: { id: string; status: RequestStatus; prev: string }) =>
      setCallbackStatus(id, status, prev),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ADMIN_CALLBACKS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update status"),
  });
}
