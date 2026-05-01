/**
 * MobileBottomBar — sticky purchase bar shown on small screens.
 *
 * On mobile the right-column "Add to Cart" can be far below the fold, so we
 * pin a compact "price + add" bar to the bottom of the viewport.
 */
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export const MobileBottomBar = ({
  lineTotal,
  withExchange,
  stock,
  onAdd,
}: {
  lineTotal: number;
  withExchange: boolean;
  stock: number;
  onAdd: () => void;
}) => (
  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.1)] px-3 py-2 flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
        {withExchange ? "With exchange" : "Total"}
      </div>
      <div className="font-display text-lg font-bold text-ink truncate">
        {formatINR(lineTotal)}
      </div>
    </div>
    <Button onClick={onAdd} disabled={stock <= 0} className="h-11 px-4 flex-1">
      <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
    </Button>
  </div>
);
