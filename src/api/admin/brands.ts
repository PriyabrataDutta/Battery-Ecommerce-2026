import { supabase } from "../client";
import { logActivity, slugify } from "@/lib/adminLog";
import type { BatteryBrand } from "@/types/catalog";

/**
 * Admin Brands API
 * --------------------------------------------------------------
 * CRUD for the `battery_brands` table. Public reads use
 * `src/api/batteryBrands.ts`; this file is the staff-only writer.
 */

export interface AdminBrandRow extends BatteryBrand {
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BrandEditableFields {
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sort_order: number;
}

export const EMPTY_BRAND: BrandEditableFields = {
  name: "",
  slug: "",
  description: null,
  logo_url: null,
  sort_order: 0,
};

export async function listAdminBrands(search?: string): Promise<AdminBrandRow[]> {
  let q = supabase
    .from("battery_brands")
    .select("*")
    .order("sort_order", { ascending: true });
  if (search) q = q.ilike("name", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminBrandRow[];
}

export async function createBrand(input: BrandEditableFields): Promise<{ id: string }> {
  const slug = input.slug.trim() || slugify(input.name);
  const { data, error } = await supabase
    .from("battery_brands")
    .insert([{ ...input, slug }])
    .select("id, name")
    .single();
  if (error || !data) throw error ?? new Error("Could not create brand");
  await logActivity("brand.create", "brand", data.id, { name: data.name });
  return { id: data.id };
}

export async function updateBrand(
  id: string,
  patch: Partial<BrandEditableFields>,
): Promise<void> {
  const { error } = await supabase.from("battery_brands").update(patch).eq("id", id);
  if (error) throw error;
  await logActivity("brand.update", "brand", id, { fields: Object.keys(patch) });
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from("battery_brands").delete().eq("id", id);
  if (error) throw error;
  await logActivity("brand.delete", "brand", id, {});
}
