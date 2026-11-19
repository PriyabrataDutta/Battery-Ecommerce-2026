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
  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur border-t border-line shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)] px-4 py-2.5 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-medium text-muted-foreground leading-none">
        {withExchange ? "With exchange · excl. GST" : "Price · excl. GST"}
      </div>
      <div className="font-display-tight text-xl font-bold text-ink truncate mt-1">
        {formatINR(lineTotal)}
      </div>
    </div>
    <Button onClick={onAdd} disabled={stock <= 0} className="h-12 px-5 flex-1">
      <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
    </Button>
  </div>
);
