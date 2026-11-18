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

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.placeOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all }),
  });
};

/** Server-side price quote; re-fetches when cart, delivery or promo change. */
export const useOrderQuote = (items: api.CartLineInput[], delivery: string, promo: string | null) =>
  useQuery({
    queryKey: ["order-quote", items, delivery, promo],
    queryFn: () => api.quoteOrder(items, delivery, promo),
    enabled: items.length > 0,
    placeholderData: (prev) => prev,
    retry: false,
  });
