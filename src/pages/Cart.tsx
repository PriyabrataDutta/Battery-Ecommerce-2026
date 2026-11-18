import { Link } from "react-router-dom";
import { useCart, useCartSync, lineKey, lineUnitPrice, hasExchangeOption, maxQty } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatINR } from "@/lib/format";
import { PriceBreakup } from "@/components/PriceBreakup";
import { Trash2, Minus, Plus, ArrowLeftRight } from "lucide-react";

const Cart = () => {
  const { items, setQty, removeItem, setExchange, subtotal, gst, total, clear } = useCart();
  useCartSync();

  return (
    <div className="container-x py-10">
      <h1 className="font-display-tight text-4xl font-bold">Your Cart</h1>
      {items.length === 0 ? (
        <div className="bg-white border border-line p-12 text-center mt-8">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/shop">Continue Shopping</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-8">
          <div className="bg-white border border-line divide-y divide-line">
            {items.map((it) => {
              const key = lineKey(it);
              const unit = lineUnitPrice(it);
              const canExchange = hasExchangeOption(it);
              return (
                <div key={key} className="p-4 sm:p-5">
                  <div className="flex gap-4 items-start">
                    {it.image && (
                      <Link to={`/product/${it.slug}`} className="shrink-0">
                        <img src={it.image} alt={it.name} className="h-20 w-20 object-contain bg-muted rounded border border-line" />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${it.slug}`} className="font-display font-semibold hover:text-primary line-clamp-2">{it.name}</Link>
                      <div className="text-xs text-muted-foreground mt-0.5">SKU: {it.sku}</div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="font-display text-lg font-bold">{formatINR(unit)}</div>
                        {canExchange && it.withExchange && it.priceWithoutExchange > 0 && (
                          <span className="text-xs text-muted-foreground line-through">{formatINR(it.priceWithoutExchange)}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeItem(key)} className="text-muted-foreground hover:text-primary p-1 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Exchange toggle + qty row */}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    {canExchange ? (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <Switch
                          checked={!!it.withExchange}
                          onCheckedChange={(v) => setExchange(key, v)}
                          className="data-[state=checked]:bg-primary"
                        />
                        <div className="flex items-center gap-1.5">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold">
                            {it.withExchange ? "With exchange" : "Without exchange"}
                          </span>
                        </div>
                        {it.withExchange && (
                          <span className="badge-pill bg-primary/10 text-primary text-[10px] font-semibold">
                            Save {formatINR(it.priceWithoutExchange - it.priceWithExchange)}
                          </span>
                        )}
                      </label>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center border border-line rounded">
                      <button onClick={() => setQty(key, it.qty - 1)} className="h-9 w-9 grid place-items-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                      <span className="w-10 text-center text-sm font-semibold">{it.qty}</span>
                      <button onClick={() => setQty(key, it.qty + 1)} disabled={it.qty >= maxQty(it)} aria-label="Increase quantity" className="h-9 w-9 grid place-items-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="bg-white border border-line p-6 h-fit sticky top-32">
            <h2 className="font-display font-bold text-lg uppercase tracking-wide">Order Summary</h2>
            <PriceBreakup className="mt-4" subtotal={subtotal} gst={gst} delivery="Chosen at checkout" total={total} />
            <p className="mt-1 text-xs text-muted-foreground">
              Standard delivery is free; express ₹299, installation ₹499 — chosen at checkout.
            </p>
            <Button asChild className="w-full mt-5" size="lg">
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full mt-2"><Link to="/quote">Request Quote Instead</Link></Button>
            <button onClick={clear} className="mt-3 text-xs text-muted-foreground hover:text-primary mx-auto block">Clear cart</button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
