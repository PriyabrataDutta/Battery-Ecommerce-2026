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

/**
 * Returns a map of car_brand slug → number of distinct products that fit
 * any model belonging to that brand. Used for showing counts in the shop filter.
 */
export async function getCarBrandProductCounts(): Promise<Record<string, number>> {
  // Join fitment → car_models → car_brands to get brand slug per fitment row
  const { data, error } = await supabase
    .from("product_fitment")
    .select("product_id, car_models!inner(car_brand_id, car_brands:car_brand_id(slug))");
  if (error) throw error;

  const byBrand: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const slug = (row as any).car_models?.car_brands?.slug;
    if (!slug) continue;
    if (!byBrand[slug]) byBrand[slug] = new Set();
    byBrand[slug].add(row.product_id);
  }

  const counts: Record<string, number> = {};
  for (const [slug, ids] of Object.entries(byBrand)) {
    counts[slug] = ids.size;
  }
  return counts;
}
