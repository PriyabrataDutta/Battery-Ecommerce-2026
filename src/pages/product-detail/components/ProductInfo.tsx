/**
 * ProductInfo — middle column of the product page.
 *
 * Brand, title, SKU, price (with/without exchange), quantity stepper, stock
 * status, pincode check, exchange toggle, CTAs, WhatsApp, trust strip.
 *
 * State that lives here (kept page-local because it never goes to the server
 * until "Add to cart"): qty, withExchange, pin.
 *
 * The actual cart write is delegated to the parent so this component stays
 * easy to test in isolation.
 */
import { Link } from "react-router-dom";
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
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { discountPct, formatINR } from "@/lib/format";
import { Trust } from "./Trust";

type Props = {
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    mrp: number | null;
    stock: number;
    short_description: string | null;
    warranty_months: number | null;
    has_exchange: boolean;
    exchange_rebate: number;
    battery_brands?: { name: string } | null;
  };
  qty: number;
  setQty: (n: number) => void;
  withExchange: boolean;
  setWithExchange: (v: boolean) => void;
  onAddToCart: () => void;
};

export const ProductInfo = ({
  product,
  qty,
  setQty,
  withExchange,
  setWithExchange,
  onAddToCart,
}: Props) => {
  const [pin, setPin] = useState("");
  const dpct = discountPct(product.price, product.mrp);
  const showExchange = product.has_exchange && product.exchange_rebate > 0;
  const exchangeUnit = product.price - product.exchange_rebate;

  const handleCheckPin = () => {
    if (!/^\d{6}$/.test(pin)) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    toast.success(`Delivery available to ${pin}`, {
      description: "Estimated 2–4 business days. Free shipping & installation.",
    });
  };

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-primary">
        {product.battery_brands?.name}
      </div>
      <h1 className="font-display-tight text-2xl sm:text-3xl lg:text-4xl font-bold mt-1 leading-tight">
        {product.name}
      </h1>
      <div className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</div>

      {/* Without exchange */}
      <div className="mt-4 sm:mt-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Without Exchange
        </div>
        <div className="flex items-baseline gap-2 sm:gap-3 mt-1 flex-wrap">
          <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
            {formatINR(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-sm sm:text-base text-muted-foreground line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="badge-pill bg-primary text-white text-[10px]">{dpct}% Off</span>
            </>
          )}
          <span className="text-xs text-muted-foreground">(Per unit)</span>
        </div>
      </div>

      {/* With exchange */}
      {showExchange && (
        <div className="mt-3 border border-primary/30 bg-primary/5 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
            With Old Battery Exchange
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl font-bold text-primary">
              {formatINR(exchangeUnit)}
            </span>
            <span className="text-xs text-ink-soft">
              Save {formatINR(product.exchange_rebate)} on return of similar old battery
            </span>
          </div>
        </div>
      )}

      <p className="text-sm text-ink-soft mt-4">{product.short_description}</p>

      {/* Qty + stock */}
      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center border border-line">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="h-10 w-10 grid place-items-center hover:bg-muted"
            aria-label="Decrease"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-12 text-center font-semibold">{qty}</span>
          <button
            onClick={() => setQty(qty + 1)}
            className="h-10 w-10 grid place-items-center hover:bg-muted"
            aria-label="Increase"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          className={`text-xs font-bold uppercase tracking-wider ${
            product.stock > 0 ? "text-success" : "text-primary"
          }`}
        >
          {product.stock > 0 ? "In Stock" : "Out of Stock"}
        </div>
      </div>

      {/* Pincode */}
      <div className="mt-5">
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

      {/* Old battery return toggle */}
      {showExchange && (
        <label className="mt-4 flex items-start gap-3 p-3 border border-line bg-white cursor-pointer hover:border-ink transition-colors">
          <Checkbox
            checked={withExchange}
            onCheckedChange={(v) => setWithExchange(Boolean(v))}
            className="mt-0.5"
          />
          <div>
            <div className="font-semibold text-sm">I will return my old battery</div>
            <div className="text-xs text-muted-foreground">
              Get {formatINR(product.exchange_rebate)} rebate. As per BMHR govt rule, returning
              old batteries is recommended.
            </div>
          </div>
        </label>
      )}

      {/* CTAs */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button size="lg" onClick={onAddToCart} disabled={product.stock <= 0}>
          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/quote">
            <FileText className="h-4 w-4 mr-2" /> Request Quote
          </Link>
        </Button>
      </div>
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener"
        className="mt-3 flex items-center justify-center gap-2 h-11 bg-whatsapp text-white text-sm font-bold uppercase tracking-wider"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp Enquiry
      </a>

      {/* Trust strip */}
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        <Trust Icon={Zap} label="Zero Maintenance" />
        <Trust Icon={ShieldCheck} label={`${product.warranty_months ?? 0} mo Warranty`} />
        <Trust Icon={BadgeCheck} label="Genuine & Secured" />
      </div>
    </div>
  );
};
