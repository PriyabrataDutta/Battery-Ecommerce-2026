import { forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { getProductImage } from "@/lib/productImage";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const ProductCard = forwardRef<HTMLAnchorElement, { product: Product }>(function ProductCard({ product }, ref) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { productIds: wishlistIds, toggle: toggleWishlist } = useWishlist();

  const withoutExchange = product.price_without_exchange || product.price;
  const withExchange = product.price_with_exchange || withoutExchange;
  const dpct = discountPct(withoutExchange, product.mrp);
  const showExchange = product.has_exchange && withExchange < withoutExchange;

  const cartPayload = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    priceWithExchange: withExchange,
    priceWithoutExchange: withoutExchange,
    image: product.primary_image_url,
    withExchange: false as const,
    exchangeRebate: product.exchange_rebate,
    hasExchange: product.has_exchange,
    stock: product.stock,
    gst_rate_id: (product as any).gst_rate_id ?? null,
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(cartPayload);
    toast.success("Added to cart", { description: product.name });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(cartPayload, 1, { buyNow: true });
    navigate("/checkout");
  };

  return (
    <Link
      ref={ref}
      to={`/product/${product.slug}`}
      className="group bg-card border border-line hover:border-ink transition-all hover-lift flex flex-col overflow-hidden rounded-lg"
    >
      <div className="relative aspect-square bg-white overflow-hidden border-b border-line rounded-t-lg">
        <img
          src={getProductImage(product.primary_image_url, product.battery_brands?.name)}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 right-8 flex flex-wrap gap-1 pointer-events-none">
          {product.is_bestseller && <span className="badge-pill bg-ink text-white text-[10px]">Bestseller</span>}
          {product.is_new && <span className="badge-pill bg-success text-white text-[10px]">New</span>}
          {dpct && <span className="badge-pill bg-primary text-white text-[10px]">{dpct}% Off</span>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-white/80 hover:bg-white border border-line shadow-sm z-10 transition-colors"
          aria-label={wishlistIds.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 transition-colors ${wishlistIds.has(product.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
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
          <span className="font-display text-lg sm:text-xl font-bold text-ink">{formatINR(withoutExchange)}</span>
          {product.mrp && product.mrp > withoutExchange && (
            <span className="text-[11px] sm:text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          Without exchange · excl. GST
        </div>

        {/* With exchange */}
        {showExchange && (
          <div className="mt-2 border-t border-dashed border-line pt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-sm sm:text-base font-bold text-primary">
                {formatINR(withExchange)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">
                With exchange · excl. GST
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground line-clamp-1">
              Save {formatINR(withoutExchange - withExchange)} on old battery return
            </div>
          </div>
        )}

        <div className="mt-auto pt-3 flex flex-col gap-2">
          <Button
            size="sm"
            className="h-11 w-full px-3 text-sm font-semibold inline-flex items-center justify-center gap-2 rounded-md shadow-sm hover:shadow-md transition-shadow"
            onClick={handleBuyNow}
            disabled={product.stock <= 0}
            aria-label={`Buy ${product.name} now`}
          >
            <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{product.stock <= 0 ? "Out of stock" : "Buy Now"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-full px-3 text-sm font-medium inline-flex items-center justify-center gap-2 rounded-md border-ink/20 hover:border-ink hover:bg-ink hover:text-white transition-colors"
            onClick={handleAdd}
            disabled={product.stock <= 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </Link>
  );
});
