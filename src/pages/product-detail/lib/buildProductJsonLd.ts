/**
 * buildProductJsonLd — generates validated JSON-LD Product structured data
 * from admin-entered product fields with safe fallbacks for every value.
 *
 * Returns null if the product lacks the minimum required data (name + price).
 */
import type { Product } from "@/types/catalog";
import { withGst } from "@/lib/gst";

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
  gstRate: number,
) {
  // ─── Base price logic ───
  // Primary price is ALWAYS the with-exchange price (admin-entered).
  const basePrice = safePrice(product.price, 0.01);
  // Store prices exclude GST; search engines get the GST-inclusive price customers pay.
  const withoutExchange = withGst(safePrice(product.price_without_exchange, basePrice), gstRate);
  const withExchangePrice = withGst(safePrice(product.price_with_exchange, basePrice), gstRate);

  const hasExchangeOffer = product.has_exchange === true && withExchangePrice < withoutExchange;

  // ─── Availability ───
  const stockNum = Number(product.stock);
  const availability =
    Number.isFinite(stockNum) && stockNum > 0 ? AVAILABILITY_IN : AVAILABILITY_OUT;

  // Shipping (standard delivery is free) and returns (7 days, see /refund-policy).
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "INR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
    },
  };
  const hasMerchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnFees: "https://schema.org/FreeReturn",
    merchantReturnLink: "https://www.kachibatteries.com/refund-policy",
  };

  // Offers: without-exchange first (the standard price), then the exchange price.
  const priceValidUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const seller = { "@id": "https://www.kachibatteries.com/#org" };
  const offerList = [
    {
      "@type": "Offer" as const,
      name: "With old battery exchange",
      priceValidUntil,
      seller,
      price: withExchangePrice,
      priceCurrency: "INR",
      description: "Price with old battery exchange",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      url: canonicalUrl,
      shippingDetails,
      hasMerchantReturnPolicy,
    },
    {
      "@type": "Offer" as const,
      name: "Without exchange",
      priceValidUntil,
      seller,
      price: withoutExchange,
      priceCurrency: "INR",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      url: canonicalUrl,
      shippingDetails,
      hasMerchantReturnPolicy,
    },
  ];

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

  // ─── Image fallback (absolute URL) ───
  const imageList = images.length > 0 ? images : ["https://www.kachibatteries.com/og-default.jpg"];

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
    offers: hasExchangeOffer ? [offerList[1], offerList[0]] : [offerList[1]],
  };

  // Conditional fields — only include when admin has data
  if (product.sku) {
    schema.sku = product.sku;
    schema.mpn = product.sku;
  }

  if (product.categories?.name) schema.category = product.categories.name;

  if (product.tags && product.tags.length > 0) {
    schema.keywords = product.tags.join(", ");
  }

  if (additionalProperty.length > 0) {
    schema.additionalProperty = additionalProperty;
  }

  return schema;
}
