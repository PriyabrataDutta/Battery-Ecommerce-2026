/**
 * ProductDetail — single product page.
 *
 * URL: /product/:slug
 *
 * Data in (all React Query hooks → src/api/products.ts):
 *   - useProductBySlug(slug)        — the product + its category + brand
 *   - useProductImages(productId)   — gallery images
 *   - useRelatedProducts(brandId, productId) — same-brand suggestions
 *
 * Page-local state (qty, withExchange) is intentionally kept here rather
 * than in a store: it only matters until the user clicks "Add to Cart".
 *
 * Layout:
 *   - Breadcrumbs
 *   - 12-col grid: gallery (5) · info (4) · price breakup (3)
 *   - Tabs: details, specs, warranty, delivery
 *   - Related products
 *   - Sticky mobile bottom bar
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImage";
import { useCart } from "@/hooks/useCart";
import {
  useProductBySlug,
  useProductImages,
  useRelatedProducts,
} from "@/hooks/queries/useProducts";

import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { PriceBreakup } from "./components/PriceBreakup";
import { DetailsTabs } from "./components/DetailsTabs";
import { RelatedProducts } from "./components/RelatedProducts";
import { MobileBottomBar } from "./components/MobileBottomBar";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [withExchange, setWithExchange] = useState(false);

  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: gallery = [] } = useProductImages(product?.id);
  const { data: related = [] } = useRelatedProducts(product?.brand_id, product?.id);

  // Build a deduped image list. Primary image goes first, then any extras
  // from the gallery table, then a brand-derived placeholder if both empty.
  const allImages = useMemo(() => {
    if (!product) return [] as string[];
    const set = new Set<string>();
    if (product.primary_image_url) set.add(product.primary_image_url);
    gallery.forEach((g) => set.add(g.url));
    if (set.size === 0) {
      set.add(getProductImage(null, product.battery_brands?.name));
    }
    return Array.from(set);
  }, [product, gallery]);

  if (isLoading)
    return <div className="container-x py-20 text-center">Loading…</div>;
  if (!product)
    return <div className="container-x py-20 text-center">Product not found.</div>;

  const showExchange = product.has_exchange && product.exchange_rebate > 0;
  const effectiveUnit = withExchange
    ? product.price - product.exchange_rebate
    : product.price;
  const lineTotal = effectiveUnit * qty;

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        image: product.primary_image_url,
        withExchange,
        exchangeRebate: product.exchange_rebate,
      },
      qty,
    );
    toast.success("Added to cart", {
      description: withExchange ? "With old battery exchange" : "Without exchange",
    });
  };

  return (
    <div className="container-x py-5 sm:py-8 pb-24 lg:pb-8">
      <nav className="text-xs text-muted-foreground mb-4 sm:mb-5 overflow-x-auto whitespace-nowrap scrollbar-none">
        <Link to="/" className="hover:text-primary">Home</Link>
        {" / "}
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        {product.categories?.slug && (
          <>
            {" / "}
            <Link
              to={`/category/${product.categories.slug}`}
              className="hover:text-primary"
            >
              {product.categories.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5">
          <ProductGallery images={allImages} alt={product.name} />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <ProductInfo
            product={product}
            qty={qty}
            setQty={setQty}
            withExchange={withExchange}
            setWithExchange={setWithExchange}
            onAddToCart={handleAdd}
          />
        </div>

        <div className="col-span-12 lg:col-span-3">
          <PriceBreakup
            qty={qty}
            unitPrice={product.price}
            mrp={product.mrp}
            exchangeRebate={product.exchange_rebate}
            withExchange={withExchange}
            showExchange={showExchange}
          />
        </div>
      </div>

      <DetailsTabs product={product} />

      <RelatedProducts products={related} />

      <MobileBottomBar
        lineTotal={lineTotal}
        withExchange={withExchange}
        stock={product.stock}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default ProductDetail;
