import { supabase } from "./client";
import type { CarBrand } from "@/types/catalog";

export async function listCarBrands(): Promise<CarBrand[]> {
  const { data, error } = await supabase.from("car_brands").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as CarBrand[];
}

export async function getCarBrandIdBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("car_brands")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getCarBrandIdsBySlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const { data, error } = await supabase.from("car_brands").select("id").in("slug", slugs);
  if (error) throw error;
  return (data ?? []).map((b) => b.id);
}

export async function getCarBrandNameBySlug(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("car_brands")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}

export async function getCarBrandNameMap(slugs: string[]): Promise<Record<string, string>> {
  if (slugs.length === 0) return {};
  const { data, error } = await supabase.from("car_brands").select("slug,name").in("slug", slugs);
  if (error) throw error;
  const map: Record<string, string> = {};
  (data ?? []).forEach((b) => {
    map[b.slug] = b.name;
  });
  return map;
}

export async function searchCarBrands(term: string, limit = 8) {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("car_brands")
    .select("id,name,slug,logo_url")
    .ilike("name", like)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
