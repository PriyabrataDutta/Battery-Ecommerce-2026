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

      {/* ─── Price Block ─── */}
      <div className="border border-line rounded-lg overflow-hidden">
        {/* Without Exchange — primary price */}
        <div className="p-4 bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Without Exchange
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

        {/* With Exchange — highlighted */}
        {showExchange && (
          <div className="p-4 bg-primary/5 border-t border-primary/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
              With Old Battery Exchange
            </div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-display text-2xl sm:text-3xl font-bold text-primary">
                {formatINR(withExchangePrice)}
              </span>
              <span className="text-xs text-primary/80 font-medium">
                Save {formatINR(saving)} on return of old battery
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Short description */}
      {product.short_description && (
        <p className="text-sm text-ink-soft leading-relaxed">{product.short_description}</p>
      )}

      {/* Stock status */}
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
          product.stock > 0 ? "text-success" : "text-destructive"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? "bg-success" : "bg-destructive"}`} />
        {product.stock > 0 ? "In Stock" : "Out of Stock"}
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qty</span>
        <div className="flex items-center border border-line rounded">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="h-10 w-10 grid place-items-center hover:bg-muted transition-colors"
            aria-label="Decrease"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center font-semibold">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="h-10 w-10 grid place-items-center hover:bg-muted transition-colors"
            aria-label="Increase"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Old battery return toggle */}
      {showExchange && (
        <label className="flex items-start gap-3 p-3.5 border border-line rounded-lg bg-white cursor-pointer hover:border-primary/50 transition-colors">
          <Checkbox
            checked={withExchange}
            onCheckedChange={(v) => setWithExchange(Boolean(v))}
            className="mt-0.5"
          />
          <div>
            <div className="font-semibold text-sm">I will return my old battery</div>
            <div className="text-xs text-muted-foreground">
              Get {formatINR(saving)} rebate. As per BMHR govt rule, returning
              old batteries is recommended.
            </div>
          </div>
        </label>
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
