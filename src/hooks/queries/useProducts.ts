import { useQuery } from "@tanstack/react-query";
import * as productsApi from "@/api/products";
import { listProductImages } from "@/api/productImages";
import { qk } from "./keys";

export const useProducts = (opts?: productsApi.ListProductsOptions) =>
  useQuery({
    queryKey: qk.products.list(opts),
    queryFn: () => productsApi.listProducts(opts),
  });

export const useProductBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.products.bySlug(slug),
    queryFn: () => productsApi.getProductBySlug(slug!),
    enabled: !!slug,
  });

export const useRelatedProducts = (
  brandId: string | null | undefined,
  excludeId: string | undefined,
) =>
  useQuery({
    queryKey: qk.products.related(brandId ?? undefined, excludeId),
    queryFn: () => productsApi.getRelatedProducts(brandId!, excludeId!),
    enabled: !!brandId && !!excludeId,
  });

export const useProductImages = (productId: string | undefined) =>
  useQuery({
    queryKey: qk.products.images(productId),
    queryFn: () => listProductImages(productId!),
    enabled: !!productId,
  });
