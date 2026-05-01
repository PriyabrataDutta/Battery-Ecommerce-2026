import { supabase } from "./client";

/**
 * Given a list of car_model ids, return the deduplicated set of product ids
 * that fit any of them. Used by the Shop page when filtering by car model
 * or car brand (which expands to all of that brand's models).
 */
export async function getProductIdsByModelIds(modelIds: string[]): Promise<string[]> {
  if (modelIds.length === 0) return [];
  const { data, error } = await supabase
    .from("product_fitment")
    .select("product_id")
    .in("car_model_id", modelIds);
  if (error) throw error;
  return Array.from(new Set((data ?? []).map((r) => r.product_id)));
}
