import { useQuery } from "@tanstack/react-query";
import { getProductIdsByModelIds } from "@/api/productFitment";
import { qk } from "./keys";

export const useProductIdsByModelIds = (modelIds: string[] | undefined) =>
  useQuery({
    queryKey: qk.fitment.productIdsByModelIds(modelIds),
    queryFn: () => getProductIdsByModelIds(modelIds ?? []),
    enabled: !!modelIds && modelIds.length > 0,
  });
