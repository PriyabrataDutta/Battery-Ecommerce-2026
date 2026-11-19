import { useQuery } from "@tanstack/react-query";
import { getProductIdsByModelIds, getCarBrandProductCounts, getFitmentForProduct } from "@/api/productFitment";
import { qk } from "./keys";

export const useProductIdsByModelIds = (modelIds: string[] | undefined) =>
  useQuery({
    queryKey: qk.fitment.productIdsByModelIds(modelIds),
    queryFn: () => getProductIdsByModelIds(modelIds ?? []),
    enabled: !!modelIds && modelIds.length > 0,
  });

/** Product count per car brand slug — used for filter badges.
 *  When `inStockOnly` is true (default), only products with stock > 0 are counted. */
export const useCarBrandProductCounts = (inStockOnly = true) =>
  useQuery({
    queryKey: qk.fitment.carBrandCounts(inStockOnly),
    queryFn: () => getCarBrandProductCounts(inStockOnly),
    staleTime: 5 * 60_000,
  });

export const useProductFitment = (productId: string | undefined) =>
  useQuery({
    queryKey: qk.fitment.byProduct(productId),
    queryFn: () => getFitmentForProduct(productId!),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
