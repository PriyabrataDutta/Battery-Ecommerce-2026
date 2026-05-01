import { useQuery } from "@tanstack/react-query";
import * as productsApi from "@/api/products";
import { qk } from "./keys";

export const useProducts = (opts?: productsApi.ListProductsOptions) =>
  useQuery({
    queryKey: qk.products.list(opts),
    queryFn: () => productsApi.listProducts(opts),
  });

/**
 * Single product by slug — includes brand, category, AND images in one query.
 * Cached for 5 minutes so back-navigation is instant.
 */
export const useProductBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.products.bySlug(slug),
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

export const useRelatedProducts = (
  brandId: string | null | undefined,
  excludeId: string | undefined,
) =>
  useQuery({
    queryKey: qk.products.related(brandId ?? undefined, excludeId),
    queryFn: () => productsApi.getRelatedProducts(brandId!, excludeId!),
    enabled: !!brandId && !!excludeId,
    staleTime: 5 * 60_000,
  });
