/**
 * Centralized query-key factory.
 *
 * Every hook in `src/hooks/queries/*` reads its `queryKey` from here.
 * This makes invalidations predictable — search this file for a key prefix
 * to find every place it's used.
 */

import type { ListProductsOptions } from "@/api/products";

export const qk = {
  products: {
    all: ["products"] as const,
    list: (opts?: ListProductsOptions) => ["products", "list", opts ?? {}] as const,
    bySlug: (slug: string | undefined) => ["products", "bySlug", slug] as const,
    related: (brandId: string | undefined, excludeId: string | undefined) =>
      ["products", "related", brandId, excludeId] as const,
    search: (term: string) => ["products", "search", term] as const,
    suggest: (term: string) => ["products", "suggest", term] as const,
    images: (productId: string | undefined) => ["product_images", productId] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
    bySlug: (slug: string | undefined) => ["categories", "bySlug", slug] as const,
    search: (term: string) => ["categories", "search", term] as const,
  },
  batteryBrands: {
    all: ["battery_brands"] as const,
    list: () => ["battery_brands", "list"] as const,
    bySlug: (slug: string | undefined) => ["battery_brands", "bySlug", slug] as const,
    nameBySlug: (slug: string | undefined) => ["battery_brands", "name", slug] as const,
    resolveByName: (term: string) => ["battery_brands", "resolveByName", term] as const,
    search: (term: string) => ["battery_brands", "search", term] as const,
  },
  carBrands: {
    all: ["car_brands"] as const,
    list: () => ["car_brands", "list"] as const,
    idBySlug: (slug: string | undefined) => ["car_brands", "idBySlug", slug] as const,
    nameBySlug: (slug: string | undefined) => ["car_brands", "nameBySlug", slug] as const,
    nameMap: (slugs: string[]) => ["car_brands", "nameMap", slugs] as const,
    idsBySlugs: (slugs: string[]) => ["car_brands", "idsBySlugs", slugs] as const,
    search: (term: string) => ["car_brands", "search", term] as const,
  },
  carModels: {
    all: ["car_models"] as const,
    byBrandId: (brandId: string | undefined) => ["car_models", "byBrandId", brandId] as const,
    idBySlug: (slug: string | undefined) => ["car_models", "idBySlug", slug] as const,
    nameBySlug: (slug: string | undefined) => ["car_models", "nameBySlug", slug] as const,
    idsByBrandIds: (brandIds: string[] | undefined) =>
      ["car_models", "idsByBrandIds", brandIds] as const,
    resolveByName: (term: string) => ["car_models", "resolveByName", term] as const,
    search: (term: string) => ["car_models", "search", term] as const,
  },
  fitment: {
    productIdsByModelIds: (modelIds: string[] | undefined) =>
      ["fitment", "productIdsByModelIds", modelIds] as const,
    carBrandCounts: () => ["fitment", "carBrandCounts"] as const,
  },
  orders: {
    all: ["orders"] as const,
    mine: (userId: string | undefined) => ["orders", "mine", userId] as const,
    overview: (userId: string | undefined) => ["orders", "overview", userId] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    mine: (userId: string | undefined) => ["addresses", "mine", userId] as const,
    default: (userId: string | undefined) => ["addresses", "default", userId] as const,
  },
  profile: {
    mine: (userId: string | undefined) => ["profile", "mine", userId] as const,
  },
} as const;
