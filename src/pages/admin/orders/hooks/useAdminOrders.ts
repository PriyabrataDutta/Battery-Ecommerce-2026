import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminOrders,
  getAdminOrderItems,
  setOrderStatus,
  setOrderNotes,
  type ListAdminOrdersOptions,
  type OrderStatus,
} from "@/api/admin/orders";

export const ADMIN_ORDERS_KEY = ["admin", "orders"] as const;

export function useAdminOrdersQuery(opts: ListAdminOrdersOptions) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, opts],
    queryFn: () => listAdminOrders(opts),
    staleTime: 5_000,
  });
}

export function useAdminOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, "items", orderId],
    queryFn: () => getAdminOrderItems(orderId!),
    enabled: !!orderId,
    staleTime: 30_000,
  });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, prev }: { id: string; status: OrderStatus; prev: string }) =>
      setOrderStatus(id, status, prev),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update status"),
  });
}

export function useSetOrderNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => setOrderNotes(id, notes),
    onSuccess: () => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not save notes"),
  });
}
