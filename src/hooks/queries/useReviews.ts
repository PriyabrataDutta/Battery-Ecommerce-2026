import { useQuery } from "@tanstack/react-query";
import { listApprovedReviews, getReviewStats } from "@/api/reviews";

export function useProductReviews(productId?: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => listApprovedReviews(productId!),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}

export function useReviewStats(productId?: string) {
  return useQuery({
    queryKey: ["review-stats", productId],
    queryFn: () => getReviewStats(productId!),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}
