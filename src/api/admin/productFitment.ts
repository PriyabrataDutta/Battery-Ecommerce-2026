import { supabase } from "../client";

/** Fetch all car_model_ids linked to a product */
export async function getProductFitmentModelIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_fitment")
    .select("car_model_id")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []).map((r) => r.car_model_id);
}

/** Replace all fitment rows for a product (delete old, insert new) */
export async function saveProductFitment(productId: string, modelIds: string[]) {
  // Delete existing
  const { error: delErr } = await supabase
    .from("product_fitment")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;

  if (modelIds.length === 0) return;

  const rows = modelIds.map((car_model_id) => ({ product_id: productId, car_model_id }));
  const { error: insErr } = await supabase.from("product_fitment").insert(rows);
  if (insErr) throw insErr;
}
