/**
 * ProductDetail — single product page.
 *
 * URL: /product/:slug
 *
 * Performance optimisations:
 * - Single Supabase query fetches product + brand + category + images (no waterfall)
 * - 5-minute staleTime means back-navigation is instant
 * - Skeleton loader reserves layout space (eliminates CLS)
 * - DetailsTabs + RelatedProducts lazy-loaded below the fold
 * - SEO meta tags via react-helmet-async
 */
import { lazy, Suspense, useMemo, useState } from "react";
import { buildProductJsonLd } from "./lib/buildProductJsonLd";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { getProductImage } from "@/lib/productImage";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import {
  useProductBySlug,
  useRelatedProducts,
} from "@/hooks/queries/useProducts";

import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { ProductSkeleton } from "./components/ProductSkeleton";
import { MobileBottomBar } from "./components/MobileBottomBar";

// Lazy-load below-fold sections
const DetailsTabs = lazy(() =>
  import("./components/DetailsTabs").then((m) => ({ default: m.DetailsTabs }))
);
const RelatedProducts = lazy(() =>
  import("./components/RelatedProducts").then((m) => ({
    default: m.RelatedProducts,
  }))
);

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [withExchange, setWithExchange] = useState(false);

  const { data: product, isLoading } = useProductBySlug(slug);
  const { data: related = [] } = useRelatedProducts(
    product?.brand_id,
    product?.id
  );

  // Build image list from the joined product_images (no separate query)
  const allImages = useMemo(() => {
    if (!product) return [] as string[];
    const set = new Set<string>();
    if (product.primary_image_url) set.add(product.primary_image_url);
    (product.product_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((img) => set.add(img.url));
    if (set.size === 0) {
      set.add(getProductImage(null, product.battery_brands?.name));
    }
    return Array.from(set);
  }, [product]);

  // Skeleton loading state — reserves layout to prevent CLS
  if (isLoading) return <ProductSkeleton />;
  if (!product)
    return (
      <div className="container-x py-20 text-center">Product not found.</div>
    );

  // ─── Pricing logic ───
  const withoutExchange =
    product.price_without_exchange && product.price_without_exchange > 0
      ? product.price_without_exchange
      : product.price;
  const withExchangePrice =
    product.price_with_exchange && product.price_with_exchange > 0
      ? product.price_with_exchange
      : withoutExchange;
  const showExchange =
    product.has_exchange === true && withExchangePrice < withoutExchange;
  const effectiveUnit = withExchange ? withExchangePrice : withoutExchange;
  const lineTotal = effectiveUnit * qty;

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        price: product.price,
        priceWithExchange: withExchangePrice,
        priceWithoutExchange: withoutExchange,
        image: product.primary_image_url,
        withExchange,
        exchangeRebate: product.exchange_rebate,
        gst_rate_id: (product as any).gst_rate_id ?? null,
      },
      qty
    );
    toast.success("Added to cart", {
      description: withExchange
        ? "With old battery exchange"
        : "Without exchange",
    });
  };

  // ─── SEO ───
  const seoTitle =
    product.meta_title ||
    `${product.name} — Buy Online | Kachi Batteries`;
  const seoDesc =
    product.meta_description ||
    product.short_description ||
    `Buy ${product.name} at ${formatINR(withoutExchange)}. ${product.warranty_months ?? 0} month warranty. Free shipping & installation across India.`;
  const canonicalUrl = `https://power-drive-finder.lovable.app/product/${product.slug}`;

  // Memoised JSON-LD string — rendered directly in DOM (not via Helmet)
  // so crawlers see it the instant React paints, with zero Helmet batching delay.
  const jsonLdString = useMemo(
    () => JSON.stringify(buildProductJsonLd(product, allImages, canonicalUrl)),
    [product, allImages, canonicalUrl],
  );

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        {product.meta_keywords && (
          <meta name="keywords" content={product.meta_keywords} />
        )}
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        {product.primary_image_url && (
          <meta property="og:image" content={product.primary_image_url} />
        )}
        <meta property="product:price:amount" content={String(withoutExchange)} />
        <meta property="product:price:currency" content="INR" />
      </Helmet>

      {/* JSON-LD rendered outside Helmet for immediate DOM injection (no async batching delay) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString,
        }}
      />

      <div className="container-x py-5 sm:py-8 pb-24 lg:pb-8">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground mb-4 sm:mb-5 overflow-x-auto whitespace-nowrap scrollbar-none"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          {" / "}
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <div>
            <ProductGallery images={allImages} alt={product.name} />
          </div>

          <div>
            <ProductInfo
              product={product}
              qty={qty}
              setQty={setQty}
              withExchange={withExchange}
              setWithExchange={setWithExchange}
              onAddToCart={handleAdd}
              lineTotal={lineTotal}
              showExchange={showExchange}
              withoutExchangePrice={withoutExchange}
              withExchangePrice={withExchangePrice}
            />
          </div>
        </div>

        {/* Below-fold sections — lazy loaded */}
        <Suspense fallback={null}>
          <DetailsTabs product={product} />
        </Suspense>

        <Suspense fallback={null}>
          <RelatedProducts products={related} />
        </Suspense>

        <MobileBottomBar
          lineTotal={lineTotal}
          withExchange={withExchange}
          stock={product.stock}
          onAdd={handleAdd}
        />
      </div>
    </>
  );
};

export default ProductDetail;
