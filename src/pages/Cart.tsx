import { Link } from "react-router-dom";
import { useCart, useCartSync, lineKey, lineUnitPrice, hasExchangeOption, maxQty } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatINR } from "@/lib/format";
import { PriceBreakup } from "@/components/PriceBreakup";
import { Trash2, Minus, Plus, ArrowLeftRight, ArrowRight, ShoppingBag } from "lucide-react";
import { Seo } from "@/components/Seo";

const Cart = () => {
  const { items, setQty, removeItem, setExchange, subtotal, gst, total, clear } = useCart();
  useCartSync();

  return (
    <div className="container-x py-8 sm:py-12">
      <Seo title="Your Cart" description="Your Cart at Kachi Batteries." noindex />
      <div className="eyebrow">Cart</div>
      <h1 className="font-display-tight text-3xl sm:text-5xl font-bold mt-2 text-ink">
        Your cart{items.length > 0 && <span className="text-muted-foreground font-semibold text-2xl sm:text-3xl"> · {items.length} item{items.length !== 1 ? "s" : ""}</span>}
      </h1>
      {items.length === 0 ? (
        <div className="surface p-10 sm:p-16 text-center mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 font-display text-lg font-bold text-ink">Your cart is empty.</p>
          <p className="mt-1 text-sm text-muted-foreground">Find the right battery for your vehicle or inverter.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/shop">Continue shopping</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mt-8 items-start">
          <div className="space-y-3">
            {items.map((it) => {
              const key = lineKey(it);
              const unit = lineUnitPrice(it);
              const canExchange = hasExchangeOption(it);
              return (
                <div key={key} className="surface p-4 sm:p-5">
                  <div className="flex gap-4 items-start">
                    {it.image && (
                      <Link to={`/product/${it.slug}`} className="shrink-0">
                        <img src={it.image} alt={it.name} className="h-20 w-20 sm:h-24 sm:w-24 object-contain bg-muted rounded-xl p-1.5" />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${it.slug}`} className="font-display font-bold text-ink hover:text-primary line-clamp-2">{it.name}</Link>
                      <div className="text-xs text-muted-foreground mt-1">SKU {it.sku}</div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="font-display-tight text-xl font-bold text-ink">{formatINR(unit)}</div>
                        {canExchange && it.withExchange && it.priceWithoutExchange > 0 && (
                          <span className="text-xs text-muted-foreground line-through">{formatINR(it.priceWithoutExchange)}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeItem(key)} aria-label={`Remove ${it.name}`} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Exchange toggle + qty row */}
                  <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-3 flex-wrap">
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
                          <span className="badge-pill bg-success/10 text-success">
                            Save {formatINR(it.priceWithoutExchange - it.priceWithExchange)}
                          </span>
                        )}
                      </label>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center rounded-full border border-line bg-background p-0.5">
                      <button onClick={() => setQty(key, it.qty - 1)} aria-label="Decrease quantity" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted"><Minus className="h-3 w-3" /></button>
                      <span className="w-10 text-center text-sm font-semibold">{it.qty}</span>
                      <button onClick={() => setQty(key, it.qty + 1)} disabled={it.qty >= maxQty(it)} aria-label="Increase quantity" className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="surface p-5 sm:p-6 lg:sticky lg:top-32">
            <h2 className="font-display-tight font-bold text-xl text-ink">Order summary</h2>
            <PriceBreakup className="mt-4" subtotal={subtotal} gst={gst} delivery="Chosen at checkout" total={total} />
            <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              Standard delivery is free; express ₹299, installation ₹499 — chosen at checkout.
            </p>
            <Button asChild className="w-full mt-5" size="lg">
              <Link to="/checkout">Proceed to checkout <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full mt-2"><Link to="/quote">Request quote instead</Link></Button>
            <button onClick={clear} className="mt-3 text-xs text-muted-foreground hover:text-primary mx-auto block">Clear cart</button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
