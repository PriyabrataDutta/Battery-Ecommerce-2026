import { Link } from "react-router-dom";
import { ArrowLeftRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCart, useCartSync, lineUnitPrice, lineKey, hasExchangeOption, maxQty } from "@/hooks/useCart";
import { formatINR, formatINRExact } from "@/lib/format";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, setQty, removeItem, setExchange, subtotal, gst, total, count } = useCart();
  useCartSync();

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white"
      >
        <SheetHeader className="px-4 py-4 border-b border-line flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Your Cart
            {count > 0 && (
              <span className="ml-1 inline-flex items-center justify-center text-[11px] font-bold bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1.5">
                {count}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
              <div className="h-16 w-16 rounded-full bg-muted grid place-items-center mb-4">
                <ShoppingCart className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-ink mb-1">Your cart is empty</p>
              <p className="text-xs text-muted-foreground mb-6">
                Add a battery to get started.
              </p>
              <Button asChild onClick={close} size="sm">
                <Link to="/shop">Browse batteries</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((it) => {
                const key = lineKey(it);
                const unit = lineUnitPrice(it);
                const canExchange = hasExchangeOption(it);
                return (
                  <li key={key} className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        to={`/product/${it.slug}`}
                        onClick={close}
                        className="h-16 w-16 flex-shrink-0 rounded-md border border-line bg-muted overflow-hidden"
                      >
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : null}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <Link
                          to={`/product/${it.slug}`}
                          onClick={close}
                          className="text-sm font-semibold text-ink hover:text-primary line-clamp-2"
                        >
                          {it.name}
                        </Link>
                        <div className="flex items-center justify-between mt-auto pt-1">
                          <div className="inline-flex items-center border border-line rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setQty(key, it.qty - 1)}
                              className="h-8 w-8 grid place-items-center text-ink hover:bg-muted"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="h-8 min-w-8 px-2 grid place-items-center text-sm font-semibold">
                              {it.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(key, it.qty + 1)}
                              disabled={it.qty >= maxQty(it)}
                              className="h-8 w-8 grid place-items-center text-ink hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-ink">
                              {formatINR(unit * it.qty)}
                            </div>
                            {it.qty > 1 && (
                              <div className="text-[10px] text-muted-foreground">
                                {formatINR(unit)} each
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(key)}
                        className="self-start text-muted-foreground hover:text-primary p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Exchange toggle */}
                    {canExchange && (
                      <label className="mt-2 flex items-center gap-2 cursor-pointer select-none pl-[76px]">
                        <Switch
                          checked={!!it.withExchange}
                          onCheckedChange={(v) => setExchange(key, v)}
                          className="data-[state=checked]:bg-primary scale-90"
                        />
                        <div className="flex items-center gap-1">
                          <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[11px] font-semibold">
                            {it.withExchange ? "With exchange" : "Without exchange"}
                          </span>
                        </div>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-line bg-white px-4 py-3 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal (excl. GST)</span>
                <span className="font-semibold">{formatINRExact(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-semibold">{formatINRExact(gst)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-line">
                <span className="font-semibold">Total (incl. GST)</span>
                <span className="text-base font-bold text-ink">{formatINRExact(total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" onClick={close} className="h-11">
                <Link to="/cart">View cart</Link>
              </Button>
              <Button asChild onClick={close} className="h-11">
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
