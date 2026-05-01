import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap } from "lucide-react";
import type { Product } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const dpct = discountPct(product.price, product.mrp);
  const showExchange = product.has_exchange && product.exchange_rebate > 0;
  const exchangePrice = product.price - product.exchange_rebate;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      image: product.primary_image_url,
      withExchange: false,
      exchangeRebate: product.exchange_rebate,
    });
    toast.success("Added to cart", { description: product.name });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      image: product.primary_image_url,
      withExchange: false,
      exchangeRebate: product.exchange_rebate,
    });
    navigate("/checkout");
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-card border border-line hover:border-ink transition-all hover-lift flex flex-col overflow-hidden rounded-lg"
    >
      <div className="relative aspect-square bg-white overflow-hidden border-b border-line rounded-t-lg">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-xs">
            No image
          </div>
        )}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
          {product.is_bestseller && <span className="badge-pill bg-ink text-white text-[10px]">Bestseller</span>}
          {product.is_new && <span className="badge-pill bg-success text-white text-[10px]">New</span>}
          {dpct && <span className="badge-pill bg-primary text-white text-[10px]">{dpct}% Off</span>}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {product.battery_brands?.name ?? "Genuine"}
        </div>
        <h3 className="mt-1 font-display font-medium text-sm sm:text-base text-ink line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">SKU: {product.sku}</div>

        {/* Without exchange (primary price) */}
        <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="font-display text-lg sm:text-xl font-bold text-ink">{formatINR(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[11px] sm:text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          Without exchange
        </div>

        {/* With exchange */}
        {showExchange && (
          <div className="mt-2 border-t border-dashed border-line pt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-sm sm:text-base font-bold text-primary">
                {formatINR(exchangePrice)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                With exchange
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground line-clamp-1">
              Save {formatINR(product.exchange_rebate)} on old battery return
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 flex flex-col gap-2">
          <Button
            size="sm"
            className="h-11 w-full px-3 text-sm font-semibold inline-flex items-center justify-center gap-2 rounded-md shadow-sm hover:shadow-md transition-shadow"
            onClick={handleBuyNow}
            aria-label={`Buy ${product.name} now`}
          >
            <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Buy Now</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-full px-3 text-sm font-medium inline-flex items-center justify-center gap-2 rounded-md border-ink/20 hover:border-ink hover:bg-ink hover:text-white transition-colors"
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
