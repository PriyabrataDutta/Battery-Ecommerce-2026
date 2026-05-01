/**
 * ProductDetail — single product page.
 *
 * URL: /product/:slug
 *
 * Layout: 2-column on desktop (gallery 7 | info 5), stacked on mobile.
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

  const withoutExchange = product.price_without_exchange && product.price_without_exchange > 0
    ? product.price_without_exchange
    : product.price;
  const withExchangePrice = product.price_with_exchange && product.price_with_exchange > 0
    ? product.price_with_exchange
    : withoutExchange;
  const showExchange = product.has_exchange === true && withExchangePrice < withoutExchange;
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
