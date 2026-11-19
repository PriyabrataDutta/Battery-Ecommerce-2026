import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { localCartStore } from "@/api/cart";
import { getCartProducts } from "@/api/products";
import { takePendingAdd, withPendingLock } from "@/lib/pendingCart";

/**
 * Completes the Add to Cart a guest clicked before signing in. Mounted once in
 * App; runs when a user is present. The pending entry is removed before it is
 * applied, under a cross-tab lock, so it is added exactly once.
 */
export function PendingCartAction() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    withPendingLock(async () => {
      const p = takePendingAdd();
      if (!p) return;
      const [live] = await getCartProducts([p.item.id]).catch(() => []);
      if (!live || live.stock <= 0) {
        toast.warning(`${p.item.name} is no longer available`);
        return;
      }
      localCartStore.add(
        {
          ...p.item,
          name: live.name,
          price: Number(live.price),
          priceWithExchange: Number(live.price_with_exchange),
          priceWithoutExchange: Number(live.price_without_exchange) || Number(live.price),
          hasExchange: live.has_exchange,
          stock: live.stock,
          gst_rate_id: live.gst_rate_id,
        },
        p.qty,
        { buyNow: p.buyNow },
      );
      toast.success("Added to your cart", { description: p.item.name });
      if (p.buyNow) navigate("/checkout", { replace: true });
    }).catch(() => undefined);
  }, [user, loading, navigate]);

  return null;
}
