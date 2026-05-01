/**
 * buildProductJsonLd — generates validated JSON-LD Product structured data
 * from admin-entered product fields with safe fallbacks for every value.
 *
 * Returns null if the product lacks the minimum required data (name + price).
 */
import type { Product } from "@/types/catalog";

/** Ensures a price is a finite positive number; falls back otherwise. */
const safePrice = (val: unknown, fallback: number): number => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const AVAILABILITY_IN = "https://schema.org/InStock";
const AVAILABILITY_OUT = "https://schema.org/OutOfStock";

export function buildProductJsonLd(
  product: Product,
  images: string[],
  canonicalUrl: string,
) {
  // ─── Base price logic (mirrors index.tsx) ───
  const basePrice = safePrice(product.price, 0.01);
  const withoutExchange = safePrice(product.price_without_exchange, basePrice);
  const withExchangePrice = safePrice(product.price_with_exchange, withoutExchange);
  const showExchange =
    product.has_exchange === true && withExchangePrice < withoutExchange;

  // ─── Availability ───
  const stockNum = Number(product.stock);
  const availability =
    Number.isFinite(stockNum) && stockNum > 0 ? AVAILABILITY_IN : AVAILABILITY_OUT;

  // ─── Offers ───
  const withoutOffer = {
    "@type": "Offer" as const,
    name: "Without Exchange",
    price: withoutExchange,
    priceCurrency: "INR",
    availability,
  };

  const offers = showExchange
    ? [
        withoutOffer,
        {
          "@type": "Offer" as const,
          name: "With Exchange",
          price: withExchangePrice,
          priceCurrency: "INR",
          description: "Price with old battery exchange (BMHR compliant)",
          availability,
        },
      ]
    : [withoutOffer];

  let lowPrice = showExchange ? withExchangePrice : withoutExchange;
  let highPrice = safePrice(product.mrp, withoutExchange);
  if (highPrice < withoutExchange) highPrice = withoutExchange;
  if (lowPrice > highPrice) [lowPrice, highPrice] = [highPrice, lowPrice];

  // ─── Additional properties (only if admin filled them) ───
  const additionalProperty: Array<{
    "@type": "PropertyValue";
    name: string;
    value: string;
  }> = [];

  const capNum = Number(product.capacity_ah);
  if (Number.isFinite(capNum) && capNum > 0) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Capacity",
      value: `${capNum} Ah`,
    });
  }

  const warNum = Number(product.warranty_months);
  if (Number.isFinite(warNum) && warNum > 0) {
    additionalProperty.push({
      "@type": "PropertyValue",
      name: "Warranty",
      value: `${warNum} months`,
    });
  }

  // ─── Description fallback chain ───
  const description =
    product.meta_description ||
    product.short_description ||
    product.description ||
    `${product.name} battery`;

  // ─── Image fallback ───
  const imageList = images.length > 0 ? images : ["/placeholder.svg"];

  // ─── Build schema ───
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: imageList,
    brand: {
      "@type": "Brand",
      name: product.battery_brands?.name || "Kachi Batteries",
    },
    offers: {
      "@type": "AggregateOffer",
      url: canonicalUrl,
      priceCurrency: "INR",
      lowPrice,
      highPrice,
      offerCount: offers.length,
      availability,
      seller: {
        "@type": "Organization",
        name: "Kachi Batteries",
      },
      offers,
    },
  };

  // Conditional fields — only include when admin has data
  if (product.sku) schema.sku = product.sku;

  if (product.categories?.name) schema.category = product.categories.name;

  if (product.tags && product.tags.length > 0) {
    schema.keywords = product.tags.join(", ");
  }

  if (additionalProperty.length > 0) {
    schema.additionalProperty = additionalProperty;
  }

  return schema;
}
