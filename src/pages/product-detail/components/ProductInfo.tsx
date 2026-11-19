/**
 * ProductInfo — right column "buy box" of the product page.
 *
 * Brand, title, stock, key chips, exchange price choice, quantity, total,
 * CTAs, fit checker (car batteries) and delivery/service list.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BatteryCharging, FileText, MessageCircle, Minus, Plus, ShieldCheck, ShoppingCart, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { discountPct, formatINR } from "@/lib/format";
import { maxQty } from "@/hooks/useCart";
import { contactInfo } from "@/components/layout/Header/lib/nav";
import type { Product } from "@/types/catalog";

type Props = {
  /** GST % for this product, from Settings → GST. */
  gstRate: number;
  product: Product;
  qty: number;
  setQty: (n: number) => void;
  withExchange: boolean;
  setWithExchange: (v: boolean) => void;
  onAddToCart: (opts?: { buyNow?: boolean }) => void;
  lineTotal: number;
  showExchange: boolean;
  withoutExchangePrice: number;
  withExchangePrice: number;
  /** Car fit checker, rendered for car batteries. */
  fitSlot?: ReactNode;
};


export const ProductInfo = ({
  product, qty, setQty, withExchange, setWithExchange, onAddToCart, lineTotal, showExchange,
  withoutExchangePrice, gstRate, withExchangePrice, fitSlot,
}: Props) => {
  const dpct = discountPct(withoutExchangePrice, product.mrp);
  const saving = showExchange ? withoutExchangePrice - withExchangePrice : 0;
  const outOfStock = product.stock <= 0;
  const limit = maxQty({ stock: product.stock });

  const stock = outOfStock
    ? { label: "Out of stock", cls: "bg-muted text-muted-foreground" }
    : product.stock <= 5
      ? { label: `Only ${product.stock} left`, cls: "bg-primary/10 text-primary" }
      : { label: "In stock", cls: "bg-success/10 text-success" };

  const chips = [
    product.capacity_ah && { Icon: BatteryCharging, label: `${product.capacity_ah} Ah` },
    product.warranty_months && { Icon: ShieldCheck, label: `${product.warranty_months} months warranty` },
  ].filter(Boolean) as { Icon: typeof Zap; label: string }[];

  const priceCard = (active: boolean, accent: boolean) =>
    `relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
      active ? (accent ? "border-primary bg-primary/[0.05] shadow-card" : "border-ink bg-card shadow-card") : "border-line bg-card hover:border-ink/30"
    }`;

  return (
    <div className="space-y-5">
      {/* Brand + title */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.battery_brands && (
            <Link to={`/brand/${product.battery_brands.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-xs font-semibold text-ink hover:border-ink/30">
              {product.battery_brands.logo_url ? (
                <img src={product.battery_brands.logo_url} alt="" className="h-5 w-10 rounded-full object-contain" />
              ) : null}
              {product.battery_brands.name}
            </Link>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stock.cls}`}>{stock.label}</span>
        </div>
        <h1 className="mt-3 font-display-tight text-[1.75rem] font-bold text-ink text-balance sm:text-4xl">{product.name}</h1>
        {product.short_description && !/^warranty/i.test(product.short_description) && (
          <p className="mt-2 text-muted-foreground">{product.short_description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map(({ Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
              <Icon className="h-3.5 w-3.5 text-volt" /> {label}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">SKU {product.sku}</span>
        </div>
      </div>

      {/* Price choice */}
      {showExchange ? (
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-ink">Choose your price</span>
            <span className="text-xs text-muted-foreground">excl. {gstRate ? `${gstRate}% ` : ""}GST</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => setWithExchange(true)} aria-pressed={withExchange} className={priceCard(withExchange, true)}>
              <span className="absolute -top-2.5 left-3 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Save {formatINR(saving)}</span>
              <span className="text-xs font-semibold text-primary">With exchange</span>
              <span className="mt-1 font-display-tight text-2xl font-bold text-primary sm:text-[1.7rem]">{formatINR(withExchangePrice)}</span>
              <span className="mt-1 text-[11px] leading-snug text-muted-foreground">Hand over your old battery</span>
            </button>
            <button type="button" onClick={() => setWithExchange(false)} aria-pressed={!withExchange} className={priceCard(!withExchange, false)}>
              <span className="text-xs font-semibold text-ink">Without exchange</span>
              <span className="mt-1 font-display-tight text-2xl font-bold text-ink sm:text-[1.7rem]">{formatINR(withoutExchangePrice)}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                {product.mrp && product.mrp > withoutExchangePrice ? <span className="line-through">{formatINR(product.mrp)}</span> : "New battery only"}
                {dpct && <span className="font-semibold text-primary">{dpct}% off</span>}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="surface p-5">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="font-display-tight text-4xl font-bold text-ink">{formatINR(withoutExchangePrice)}</span>
            {product.mrp && product.mrp > withoutExchangePrice && <span className="text-sm text-muted-foreground line-through">{formatINR(product.mrp)}</span>}
            {dpct && <span className="badge-pill bg-primary/10 text-primary">{dpct}% off</span>}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">Excludes {gstRate ? `${gstRate}% ` : ""}GST · added in your cart</div>
        </div>
      )}

      {/* Quantity + total */}
      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-line bg-white p-1" role="group" aria-label="Quantity">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1 || outOfStock} aria-label="Decrease quantity" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted disabled:opacity-40"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-display font-bold tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(limit, qty + 1))} disabled={qty >= limit || outOfStock} aria-label="Increase quantity" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-2 text-white">
          <span className="text-xs text-white/60">{qty > 1 ? `${qty} × ${formatINR(withExchange ? withExchangePrice : withoutExchangePrice)}` : withExchange ? "Total with exchange" : "Total"}<br className="hidden sm:block" /><span className="sm:hidden"> · </span>excl. GST</span>
          <span className="font-display-tight text-2xl font-bold">{formatINR(lineTotal)}</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="h-[52px] text-base" onClick={() => onAddToCart()} disabled={outOfStock}>
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </Button>
        <Button size="lg" variant="secondary" className="h-[52px] text-base" onClick={() => onAddToCart({ buyNow: true })} disabled={outOfStock}>
          <Zap className="h-4 w-4" /> Buy now
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
        <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-success hover:underline">
          <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
        </a>
        <Link to="/quote" className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-primary">
          <FileText className="h-4 w-4" /> Bulk / B2B quote
        </Link>
      </div>

      {fitSlot}

    </div>
  );
};
