import { supabase } from "./client";
import type { CarModel } from "@/types/catalog";

export async function listCarModelsByBrandId(brandId: string): Promise<CarModel[]> {
  const { data, error } = await supabase
    .from("car_models")
    .select("*")
    .eq("car_brand_id", brandId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as CarModel[];
}

export async function getCarModelIdsByBrandIds(brandIds: string[]): Promise<string[]> {
  if (brandIds.length === 0) return [];
  const { data, error } = await supabase
    .from("car_models")
    .select("id")
    .in("car_brand_id", brandIds);
  if (error) throw error;
  return (data ?? []).map((m) => m.id);
}

export async function getCarModelIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("car_models")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getCarModelNameBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("car_models")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

/**
 * Resolve a free-text query to a single car model id (if one matches).
 */
export async function resolveCarModelIdByName(term: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("car_models")
    .select("id,slug")
    .ilike("name", `%${term}%`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function searchCarModels(term: string, limit = 12) {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("car_models")
    .select("id,name,slug, car_brands(name,slug)")
    .ilike("name", like)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
