import { supabase } from "./client";
import type { BatteryBrand } from "@/types/catalog";

export async function listBatteryBrands(): Promise<BatteryBrand[]> {
  const { data, error } = await supabase.from("battery_brands").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as BatteryBrand[];
}

export async function getBatteryBrandBySlug(slug: string): Promise<BatteryBrand | null> {
  const { data, error } = await supabase
    .from("battery_brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as BatteryBrand) ?? null;
}

/**
 * Resolve a free-text query (e.g. "amaron") to a brand slug, if one matches.
 * Returns the slug or null.
 */
export async function resolveBrandSlugByName(term: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("battery_brands")
    .select("slug")
    .ilike("name", `%${term}%`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.slug ?? null;
}

export async function getBatteryBrandNameBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("battery_brands")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function searchBatteryBrands(term: string, limit = 8) {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("battery_brands")
    .select("id,name,slug,logo_url")
    .ilike("name", like)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
