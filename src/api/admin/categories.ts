import { supabase } from "../client";
import { logActivity, slugify } from "@/lib/adminLog";
import type { Category } from "@/types/catalog";

/**
 * Admin Categories API
 * --------------------------------------------------------------
 * CRUD for the `categories` table.
 */

export interface AdminCategoryRow extends Category {
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryEditableFields {
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
}

export const EMPTY_CATEGORY: CategoryEditableFields = {
  name: "",
  slug: "",
  description: null,
  icon: null,
  image_url: null,
  parent_id: null,
  sort_order: 0,
};

export async function listAdminCategories(search?: string): Promise<AdminCategoryRow[]> {
  let q = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (search) q = q.ilike("name", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminCategoryRow[];
}

export async function createCategory(input: CategoryEditableFields): Promise<{ id: string }> {
  const slug = input.slug.trim() || slugify(input.name);
  const { data, error } = await supabase
    .from("categories")
    .insert([{ ...input, slug }])
    .select("id, name")
    .single();
  if (error || !data) throw error ?? new Error("Could not create category");
  await logActivity("category.create", "category", data.id, { name: data.name });
  return { id: data.id };
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryEditableFields>,
): Promise<void> {
  const { error } = await supabase.from("categories").update(patch).eq("id", id);
  if (error) throw error;
  await logActivity("category.update", "category", id, { fields: Object.keys(patch) });
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
  await logActivity("category.delete", "category", id, {});
}
