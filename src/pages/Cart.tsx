import { Link } from "react-router-dom";
import { useCart, lineKey, lineUnitPrice } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { Trash2, Minus, Plus } from "lucide-react";

const Cart = () => {
  const { items, setQty, removeItem, subtotal, clear } = useCart();

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
              return (
                <div key={key} className="p-4 flex gap-4 items-center">
                  {it.image && <img src={it.image} alt={it.name} className="h-20 w-20 object-cover bg-muted" />}
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${it.slug}`} className="font-display font-semibold hover:text-primary line-clamp-2">{it.name}</Link>
                    <div className="text-xs text-muted-foreground">SKU: {it.sku}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="font-bold">{formatINR(unit)}</div>
                      {it.withExchange ? (
                        <span className="badge-pill bg-primary text-white text-[10px]">With Exchange</span>
                      ) : it.exchangeRebate ? (
                        <span className="badge-pill bg-muted text-ink-soft text-[10px]">No Exchange</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center border border-line">
                    <button onClick={() => setQty(key, it.qty - 1)} className="h-9 w-9 grid place-items-center hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="w-10 text-center text-sm font-semibold">{it.qty}</span>
                    <button onClick={() => setQty(key, it.qty + 1)} className="h-9 w-9 grid place-items-center hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeItem(key)} className="text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
          <aside className="bg-white border border-line p-6 h-fit sticky top-32">
            <h2 className="font-display font-bold text-lg uppercase tracking-wide">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-success font-semibold">FREE</span></div>
            </div>
            <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
              <span>Total</span><span>{formatINR(subtotal)}</span>
            </div>
            <Button className="w-full mt-5" size="lg" disabled>Checkout (coming soon)</Button>
            <Button asChild variant="outline" className="w-full mt-2"><Link to="/quote">Request Quote Instead</Link></Button>
            <button onClick={clear} className="mt-3 text-xs text-muted-foreground hover:text-primary mx-auto block">Clear cart</button>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
