import { supabase } from "./client";
import type { Category } from "@/types/catalog";

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Pick<Category, "name" | "description"> | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Lightweight matches for the search dropdown / results page.
 */
export async function searchCategories(term: string, limit = 8) {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon")
    .ilike("name", like)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
