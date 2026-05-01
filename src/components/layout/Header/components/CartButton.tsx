import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

/**
 * CartButton
 * --------------------------------------------------------------
 * Header cart icon with item-count badge.
 *
 * On screens <1024px (mobile/tablet) clicking opens the slide-in
 * drawer instead of navigating — we ask the parent to open it via
 * `onOpenDrawer` so cart drawer state stays inside the Header
 * orchestrator.
 */
export function CartButton({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { count } = useCart();

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative h-11 w-11 sm:h-10 sm:w-10 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Link
        to="/cart"
        aria-label="Cart"
        onClick={(e) => {
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            e.preventDefault();
            onOpenDrawer();
          }
        }}
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 grid place-items-center">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
