import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Zap, Check } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { getProductImage } from "@/lib/productImage";
import { useAddToCart } from "@/hooks/useAddToCart";

export const ProductCard = forwardRef<HTMLAnchorElement, { product: Product; showSpecs?: boolean; fitLabel?: string }>(function ProductCard({ product, showSpecs, fitLabel }, ref) {
  const addToCart = useAddToCart();
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
    addToCart(cartPayload);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(cartPayload, 1, { buyNow: true });
  };

  return (
    <Link
      ref={ref}
      to={`/product/${product.slug}`}
      className="group surface flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated hover:border-ink/15"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-muted/70 to-white">
        <img
          src={getProductImage(product.primary_image_url, product.battery_brands?.name)}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-5 sm:p-6 transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-1.5 pointer-events-none">
          {dpct && <span className="badge-pill bg-primary text-white">{dpct}% off</span>}
          {product.is_bestseller && <span className="badge-pill bg-ink text-white">Bestseller</span>}
          {product.is_new && <span className="badge-pill bg-volt text-ink">New</span>}
        </div>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-card backdrop-blur transition-colors hover:bg-white"
          aria-label={wishlistIds.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 transition-colors ${wishlistIds.has(product.id) ? "fill-primary text-primary" : "text-ink/60"}`} />
        </button>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-card">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {product.battery_brands?.name ?? "Genuine"}
        </div>
        <h3 className="mt-1.5 font-display font-semibold text-[15px] sm:text-base text-ink line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-1 truncate text-xs text-muted-foreground">SKU {product.sku}</div>
        {fitLabel && (
          <div title={`Fits your ${fitLabel}`} className="mt-2.5 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> <span className="truncate">Fits your car</span>
          </div>
        )}
        {showSpecs && (product.capacity_ah || product.warranty_months) && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {product.capacity_ah && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">{product.capacity_ah}Ah</span>}
            {product.warranty_months && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-ink">{product.warranty_months} mo warranty</span>}
            {product.categories?.name && <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-ink-soft">{product.categories.name.replace(/ Batteries$/, "")}</span>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-ink">{formatINR(withoutExchange)}</span>
          {product.mrp && product.mrp > withoutExchange && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(product.mrp)}</span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">Without exchange · excl. GST</div>

        {showExchange && (
          <div className="mt-3 rounded-xl bg-primary/[0.06] px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-base font-bold text-primary">{formatINR(withExchange)}</span>
              <span className="text-[11px] font-medium text-primary/80">with exchange · excl. GST</span>
            </div>
            <div className="text-[11px] text-ink-soft/80 line-clamp-1">
              Save {formatINR(withoutExchange - withExchange)} on old battery return
            </div>
          </div>
        )}

        <div className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] gap-1.5 pt-4 sm:gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-line bg-white hover:border-ink hover:bg-ink hover:text-white"
            onClick={handleAdd}
            disabled={product.stock <= 0}
            aria-label={`Add ${product.name} to cart`}
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Add to Cart</span>
          </Button>
          <Button
            className="h-10 sm:h-11 w-full min-w-0 px-2.5 sm:px-4 text-[13px] sm:text-sm"
            onClick={handleBuyNow}
            disabled={product.stock <= 0}
            aria-label={`Buy ${product.name} now`}
          >
            <Zap className="hidden sm:block h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{product.stock <= 0 ? "Out of stock" : "Buy Now"}</span>
          </Button>
        </div>
      </div>
    </Link>
  );
});
