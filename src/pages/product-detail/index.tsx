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
import { useGstRateOf, withGst } from "@/lib/gst";
import { useAddToCart } from "@/hooks/useAddToCart";
import {
  useProductBySlug,
  useRelatedProducts,
} from "@/hooks/queries/useProducts";

import { ProductGallery } from "./components/ProductGallery";
import { ProductInfo } from "./components/ProductInfo";
import { ProductSkeleton } from "./components/ProductSkeleton";
import { MobileBottomBar } from "./components/MobileBottomBar";
import { SITE_URL } from "@/lib/site";
import { FitChecker } from "./components/FitChecker";
import { ServiceStrip } from "./components/ServiceStrip";
import { useProductFitment } from "@/hooks/queries/useFitment";
import { useCarBrands } from "@/hooks/queries/useBrands";
import { INVERTER_SLUGS } from "@/pages/shop/inverterKinds";
import { discountPct } from "@/lib/format";

// Lazy-load below-fold sections
const ProductSections = lazy(() =>
  import("./components/ProductSections").then((m) => ({ default: m.ProductSections }))
);
const RelatedProducts = lazy(() =>
  import("./components/RelatedProducts").then((m) => ({
    default: m.RelatedProducts,
  }))
);

const ProductDetail = () => {
  const { slug } = useParams();
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const [withExchange, setWithExchange] = useState(false);

  const { data: product, isLoading } = useProductBySlug(slug);
  const { rateOf } = useGstRateOf();
  // This product's GST % from Settings → GST (its own slab, or the default).
  const gstRate = rateOf(product?.gst_rate_id) ?? 0;
  const isCar = product?.categories?.slug === "car-batteries";
  const isInverter = (INVERTER_SLUGS as readonly string[]).includes(product?.categories?.slug ?? "");
  const { data: fitment = [] } = useProductFitment(isCar ? product?.id : undefined);
  const { data: carBrands = [] } = useCarBrands();
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

  const canonicalUrl = product
    ? `${SITE_URL}/product/${product.slug}`
    : "";

  const jsonLdString = useMemo(
    () =>
      product
        ? JSON.stringify(buildProductJsonLd(product, allImages, canonicalUrl, gstRate))
        : "",
    [product, allImages, canonicalUrl, gstRate],
  );

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

  const handleAdd = (opts?: { buyNow?: boolean }) => {
    addToCart(
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
        hasExchange: product.has_exchange,
        stock: product.stock,
        gst_rate_id: (product as any).gst_rate_id ?? null,
      },
      qty,
      { buyNow: opts?.buyNow === true, toast: withExchange ? "With old battery exchange" : "Without exchange" },
    );
  };

  // ─── SEO ───
  // e.g. "Amaron CR-150 Tall Tubular 150Ah — Price & Warranty | Kachi Batteries"
  const seoTitle =
    product.meta_title ||
    `${product.name}${product.capacity_ah && !product.name.includes(`${product.capacity_ah}`) ? ` ${product.capacity_ah}Ah` : ""} — Price & Warranty | Kachi Batteries`;
  const seoDesc =
    product.meta_description ||
    `Buy ${product.name} at ${formatINR(withGst(withoutExchange, gstRate))} incl. GST. ${product.warranty_months ?? 0} month warranty. Free standard delivery, doorstep installation available.`;
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
        <meta property="product:price:amount" content={String(withGst(withoutExchange, gstRate))} />
        <meta property="product:price:currency" content="INR" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        {product.primary_image_url && <meta name="twitter:image" content={product.primary_image_url} />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { name: "Home", item: SITE_URL },
              isCar ? { name: "Car batteries", item: `${SITE_URL}/shop/car-batteries` } : isInverter ? { name: "Inverter batteries", item: `${SITE_URL}/shop/inverter-batteries` } : { name: "Shop", item: `${SITE_URL}/shop` },
              { name: product.name, item: canonicalUrl },
            ].map((b, i) => ({ "@type": "ListItem", position: i + 1, ...b })),
          })}
        </script>
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
          className="text-xs font-medium text-muted-foreground mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap scrollbar-none"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          {" / "}
          <Link to={isCar ? "/shop/car-batteries" : isInverter ? "/shop/inverter-batteries" : "/shop"} className="hover:text-primary">
            {isCar ? "Car batteries" : isInverter ? "Inverter batteries" : "Shop"}
          </Link>
          {isInverter && product.categories?.slug !== "inverter-ups" && product.categories?.name && (
            <>
              {" / "}
              <Link to={`/shop/inverter-batteries?kind=${product.categories.slug}`} className="hover:text-primary">
                {product.categories.name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-ink font-semibold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="relative lg:sticky lg:top-40">
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-1.5">
              {discountPct(withoutExchange, product.mrp) && <span className="badge-pill bg-primary text-white">{discountPct(withoutExchange, product.mrp)}% off</span>}
              {product.is_bestseller && <span className="badge-pill bg-ink text-white">Bestseller</span>}
              {product.is_new && <span className="badge-pill bg-volt text-ink">New</span>}
            </div>
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
              gstRate={gstRate}
              fitSlot={isCar && fitment.length > 0 ? <FitChecker fitment={fitment} allBrands={carBrands} /> : undefined}
            />
          </div>
        </div>

        <ServiceStrip />

        {/* Below-fold sections — lazy loaded */}
        <Suspense fallback={null}>
          <ProductSections product={product} fitment={fitment} />
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
