import { supabase } from "../client";
import { logActivity, slugify } from "@/lib/adminLog";
import type { Product } from "@/types/catalog";

/**
 * Admin Products API
 * --------------------------------------------------------------
 * All mutations for managing the product catalog from the admin
 * dashboard. RLS policies on `products` allow these because the
 * caller is staff (`is_staff(auth.uid())` is true). Each mutation
 * also writes an audit-log entry via `logActivity`.
 *
 * Keep this file the **single point of contact** for admin
 * product writes — feature components must never hit Supabase
 * directly. See `src/api/README.md` for the convention.
 */

export type AdminProductRow = Omit<Product, "battery_brands" | "categories"> & {
  battery_brands: { id: string; name: string; slug: string } | null;
  categories: { id: string; name: string; slug: string } | null;
};

export interface ListAdminProductsOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string; // "active" | "draft" | "archived" | "" (all)
  lowStockOnly?: boolean;
  limit?: number;
}

/**
 * Staff-facing product listing — includes draft/archived products
 * (RLS: staff bypasses the `status='active'` filter).
 */
export async function listAdminProducts(
  opts: ListAdminProductsOptions = {},
): Promise<AdminProductRow[]> {
  let q = supabase
    .from("products")
    .select("*, battery_brands(id,name,slug), categories(id,name,slug)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.search) {
    const like = `%${opts.search}%`;
    q = q.or(`name.ilike.${like},sku.ilike.${like}`);
  }
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.brandId) q = q.eq("brand_id", opts.brandId);
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.lowStockOnly) q = q.lt("stock", 5);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminProductRow[];
}

/**
 * Editable shape used by the admin product editor. Mirrors the
 * `products` columns we expose for editing — keep this in sync
 * with `ProductEditor.tsx` and the DB schema.
 */
export interface ProductEditableFields {
  name: string;
  slug: string;
  sku: string;
  brand_id: string | null;
  category_id: string | null;
  mrp: number | null;
  price_with_exchange: number;
  price_without_exchange: number;
  price: number;
  stock: number;
  capacity_ah: number | null;
  warranty_months: number | null;
  short_description: string | null;
  description: string | null;
  primary_image_url: string | null;
  status: string; // "active" | "draft" | "archived"
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  has_exchange: boolean;
  exchange_rebate: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  tags: string[];
}

export async function createProduct(input: ProductEditableFields): Promise<{ id: string }> {
  const slug = input.slug?.trim() ? input.slug.trim() : slugify(input.name);
  const { data, error } = await supabase
    .from("products")
    .insert([{ ...input, slug }])
    .select("id, name, sku")
    .single();
  if (error || !data) throw error ?? new Error("Could not create product");
  await logActivity("product.create", "product", data.id, { name: data.name, sku: data.sku });
  return { id: data.id };
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductEditableFields>,
): Promise<void> {
  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) throw error;
  await logActivity("product.update", "product", id, { fields: Object.keys(patch) });
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  await logActivity("product.delete", "product", id, {});
}
