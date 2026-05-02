import { useQuery } from "@tanstack/react-query";
import { getProductIdsByModelIds, getCarBrandProductCounts } from "@/api/productFitment";
import { qk } from "./keys";

export const useProductIdsByModelIds = (modelIds: string[] | undefined) =>
  useQuery({
    queryKey: qk.fitment.productIdsByModelIds(modelIds),
    queryFn: () => getProductIdsByModelIds(modelIds ?? []),
    enabled: !!modelIds && modelIds.length > 0,
  });

/** Product count per car brand slug — used for filter badges. */
export const useCarBrandProductCounts = () =>
  useQuery({
    queryKey: qk.fitment.carBrandCounts(),
    queryFn: getCarBrandProductCounts,
    staleTime: 5 * 60_000,
  });
