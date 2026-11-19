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
 * Returns a map of car_brand slug → number of distinct active products that
 * fit any model of that brand, counted in the database
 * (`car_brand_product_counts`). When `inStockOnly` is true, only stock > 0.
 */
export async function getCarBrandProductCounts(
  inStockOnly = false,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("car_brand_product_counts", {
    in_stock_only: inStockOnly,
  });
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((r) => [r.slug, Number(r.product_count)]));
}

export interface ProductFitment {
  id: string;
  name: string;
  slug: string;
  years: string | null;
  brand: { name: string; slug: string; logo_url: string | null };
}

/** Car models a product fits, with their brand, sorted by brand then model. */
export async function getFitmentForProduct(productId: string): Promise<ProductFitment[]> {
  const { data, error } = await supabase
    .from("product_fitment")
    .select("car_models(id, name, slug, years, car_brands(name, slug, logo_url))")
    .eq("product_id", productId);
  if (error) throw error;
  type Row = { car_models: (Omit<ProductFitment, "brand"> & { car_brands: ProductFitment["brand"] | null }) | null };
  return ((data ?? []) as unknown as Row[])
    .map((r) => r.car_models)
    .filter((m): m is NonNullable<Row["car_models"]> => !!m && !!m.car_brands)
    .map(({ car_brands, ...m }) => ({ ...m, brand: car_brands! }))
    .sort((a, b) => a.brand.name.localeCompare(b.brand.name) || a.name.localeCompare(b.name));
}
