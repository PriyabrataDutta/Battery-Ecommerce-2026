import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyWishlist, addToWishlist, removeFromWishlist } from "@/api/wishlist";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: items = [] } = useQuery({
    queryKey: ["wishlist", uid],
    queryFn: () => listMyWishlist(uid!),
    enabled: !!uid,
    staleTime: 60_000,
  });

  const productIds = useMemo(() => new Set(items.map((i) => i.product_id)), [items]);

  const addMut = useMutation({
    mutationFn: (productId: string) => addToWishlist(uid!, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", uid] }),
    onError: () => toast.error("Could not add to wishlist"),
  });

  const removeMut = useMutation({
    mutationFn: (productId: string) => removeFromWishlist(uid!, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist", uid] }),
    onError: () => toast.error("Could not remove from wishlist"),
  });

  const toggle = useCallback(
    (productId: string) => {
      if (!uid) {
        toast.error("Please sign in to save items");
        return;
      }
      if (productIds.has(productId)) {
        removeMut.mutate(productId);
        toast.success("Removed from wishlist");
      } else {
        addMut.mutate(productId);
        toast.success("Added to wishlist");
      }
    },
    [uid, productIds, addMut, removeMut],
  );

  return { items, productIds, toggle, isSignedIn: !!uid };
}
