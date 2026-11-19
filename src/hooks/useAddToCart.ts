import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { CartItem } from "@/types/catalog";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { savePendingAdd } from "@/lib/pendingCart";

/**
 * The one Add to Cart / Buy now entry point. Signed-in customers add straight
 * away; guests are sent to sign in, and PendingCartAction completes the add
 * once (and only once) after they're signed in.
 */
export function useAddToCart() {
  const { user, loading } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (item: Omit<CartItem, "qty">, qty = 1, opts?: { buyNow?: boolean; toast?: string }) => {
      const buyNow = opts?.buyNow === true;
      if (loading) return; // session still restoring — ignore the click rather than guess
      if (!user) {
        const returnTo = location.pathname + location.search;
        savePendingAdd({ item, qty, buyNow, returnTo });
        toast.info("Sign in to add this to your cart", { description: item.name });
        navigate(`/auth?next=${encodeURIComponent(buyNow ? "/checkout" : returnTo)}&reason=cart`);
        return;
      }
      addItem(item, qty, { buyNow });
      if (buyNow) navigate("/checkout");
      else toast.success("Added to cart", { description: opts?.toast ?? item.name });
    },
    [user, loading, addItem, navigate, location.pathname, location.search],
  );
}
