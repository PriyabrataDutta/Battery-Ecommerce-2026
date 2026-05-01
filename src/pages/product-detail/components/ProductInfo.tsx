/**
 * ProductInfo — right column of the product page.
 *
 * Displays brand, title, SKU, 3-tier pricing (MRP / Without Exchange / With Exchange),
 * quantity stepper, exchange toggle, pincode check, CTAs, and trust strip.
 */
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  FileText,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { discountPct, formatINR } from "@/lib/format";
import { Trust } from "./Trust";

import type { Product } from "@/types/catalog";

type Props = {
  product: Product;
  qty: number;
  setQty: (n: number) => void;
  withExchange: boolean;
  setWithExchange: (v: boolean) => void;
  onAddToCart: () => void;
  lineTotal: number;
  showExchange: boolean;
  withoutExchangePrice: number;
  withExchangePrice: number;
};

export const ProductInfo = ({
  product,
  qty,
  setQty,
  withExchange,
  setWithExchange,
  onAddToCart,
  lineTotal,
  showExchange,
  withoutExchangePrice,
  withExchangePrice,
}: Props) => {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const dpct = discountPct(withoutExchangePrice, product.mrp);
  const saving = showExchange ? withoutExchangePrice - withExchangePrice : 0;

  const handleCheckPin = () => {
    if (!/^\d{6}$/.test(pin)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    toast.success(`Delivery available to ${pin}`, {
      description: "Estimated 2–4 business days. Free shipping & installation.",
    });
  };

  const handleBuyNow = () => {
    onAddToCart();
    navigate("/checkout");
  };

  return (
    <div className="space-y-5">
      {/* Brand + Title + SKU */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-primary">
          {product.battery_brands?.name}
        </div>
        <h1 className="font-display-tight text-2xl sm:text-3xl lg:text-[2.5rem] font-bold mt-1.5 leading-tight">
          {product.name}
        </h1>
        <div className="text-xs text-muted-foreground mt-1.5">SKU: {product.sku}</div>
      </div>

      {/* ─── Price Selection ─── */}
      {showExchange ? (
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Select Pricing Option
          </div>

          {/* Without Exchange option */}
          <button
            type="button"
            onClick={() => setWithExchange(false)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              !withExchange
                ? "border-ink bg-white ring-1 ring-ink/10 shadow-sm"
                : "border-line bg-white hover:border-ink/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    !withExchange ? "border-ink" : "border-muted-foreground/40"
                  }`}>
                    {!withExchange && <div className="h-2 w-2 rounded-full bg-ink" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Without Exchange</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 ml-6">Buy new battery only</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl sm:text-3xl font-bold text-ink">
                  {formatINR(withoutExchangePrice)}
                </div>
                {product.mrp && product.mrp > withoutExchangePrice && (
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
                    {dpct && <span className="badge-pill bg-primary text-white text-[10px]">{dpct}% Off</span>}
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* With Exchange option */}
          <button
            type="button"
            onClick={() => setWithExchange(true)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              withExchange
                ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                : "border-line bg-white hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    withExchange ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {withExchange && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-primary">With Exchange</span>
                  <span className="badge-pill bg-success/10 text-success text-[10px] font-bold">
                    Save {formatINR(saving)}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 ml-6">
                  Return old battery & get rebate (BMHR compliant)
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl sm:text-3xl font-bold text-primary">
                  {formatINR(withExchangePrice)}
                </div>
                <span className="text-xs text-muted-foreground line-through">{formatINR(withoutExchangePrice)}</span>
              </div>
            </div>
          </button>

          <div className="text-[10px] text-muted-foreground">Inclusive of all taxes</div>
        </div>
      ) : (
        /* No exchange pricing — show single price */
        <div className="border border-line rounded-lg p-4 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Price
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
              {formatINR(withoutExchangePrice)}
            </span>
            {product.mrp && product.mrp > withoutExchangePrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(product.mrp)}
              </span>
            )}
            {dpct && (
              <span className="badge-pill bg-primary text-white text-[10px] font-semibold">
                {dpct}% Off
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Inclusive of all taxes</div>
        </div>
      )}

      {/* Line total summary */}
      {qty > 0 && (
        <div className="bg-muted/50 border border-line rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {withExchange ? "Total (with exchange)" : "Total"}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {qty > 1 ? `${qty} × ${formatINR(withExchange ? withExchangePrice : withoutExchangePrice)}` : ""}
              </span>
            </div>
            <span className="font-display text-xl sm:text-2xl font-bold text-ink">
              {formatINR(lineTotal)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Truck className="h-3 w-3 text-success" />
            <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Free Shipping & Installation</span>
          </div>
        </div>
      )}

      {/* Pincode check */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Check Delivery
        </label>
        <div className="flex gap-2 mt-1">
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit pincode"
            className="h-11"
          />
          <Button variant="outline" className="h-11" onClick={handleCheckPin}>
            Check
          </Button>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-12" onClick={handleBuyNow} disabled={product.stock <= 0}>
          <Zap className="h-4 w-4 mr-2" /> Buy Now
        </Button>
        <Button size="lg" variant="outline" className="h-12" onClick={onAddToCart} disabled={product.stock <= 0}>
          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" variant="outline" className="h-11" asChild>
          <Link to="/quote">
            <FileText className="h-4 w-4 mr-2" /> Request Quote
          </Link>
        </Button>
        <a
          href="https://wa.me/919999999999"
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-2 h-11 bg-whatsapp text-white text-sm font-bold uppercase tracking-wider rounded-md"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-line">
        <Trust Icon={Zap} label="Zero Maintenance" />
        <Trust Icon={ShieldCheck} label={`${product.warranty_months ?? 0} mo Warranty`} />
        <Trust Icon={BadgeCheck} label="Genuine & Secured" />
      </div>
    </div>
  );
};
