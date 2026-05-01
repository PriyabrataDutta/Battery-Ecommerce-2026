import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/orders";
import { qk } from "./keys";

export const useMyOrders = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.orders.mine(userId),
    queryFn: () => api.listMyOrders(userId!),
    enabled: !!userId,
  });

export const useAccountOverview = (userId: string | undefined, userEmail: string | null) =>
  useQuery({
    queryKey: qk.orders.overview(userId),
    queryFn: () => api.getOverviewSummary(userId!, userEmail),
    enabled: !!userId,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all }),
  });
};
