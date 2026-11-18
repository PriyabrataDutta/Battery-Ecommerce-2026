import { supabase } from "./client";
import type { Product } from "@/types/catalog";

export interface ListProductsOptions {
  categorySlug?: string;
  brandId?: string;
  status?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  limit?: number;
}

/**
 * List products with optional filters. Always joins battery_brands.
 * When `categorySlug` is provided, the query uses an inner join on categories
 * so only products in that category are returned.
 */
export async function listProducts(opts: ListProductsOptions = {}): Promise<Product[]> {
  const select = opts.categorySlug
    ? "*, battery_brands(*), categories!inner(slug)"
    : "*, battery_brands(*)";
  let q = supabase.from("products").select(select).eq("status", opts.status ?? "active");
  if (opts.categorySlug) q = q.eq("categories.slug", opts.categorySlug);
  if (opts.brandId) q = q.eq("brand_id", opts.brandId);
  if (opts.isFeatured) q = q.eq("is_featured", true);
  if (opts.isBestseller) q = q.eq("is_bestseller", true);
  if (opts.isNew) q = q.eq("is_new", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

/**
 * Single product by slug — joins brand, category, AND images in one request.
 * Eliminates the separate useProductImages waterfall query.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*, battery_brands(*), categories(*), product_images(id, url, alt, sort_order)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function getRelatedProducts(brandId: string, excludeId: string, limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, battery_brands(*)")
    .eq("brand_id", brandId)
    .neq("id", excludeId)
    .eq("status", "active")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

/**
 * Free-text search across name, sku, short_description.
 */
export async function searchProducts(term: string, limit = 24): Promise<Product[]> {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("products")
    .select("*, battery_brands(*), categories(slug,name)")
    .eq("status", "active")
    .or(`name.ilike.${like},sku.ilike.${like},short_description.ilike.${like}`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

/**
 * Lightweight product search for autocomplete / smart search dropdown.
 */
export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  primary_image_url: string | null;
  battery_brands: { name: string } | null;
}

export async function suggestProducts(term: string, limit = 6): Promise<ProductSuggestion[]> {
  const like = `%${term}%`;
  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,sku,price,primary_image_url, battery_brands(name)")
    .eq("status", "active")
    .or(`name.ilike.${like},sku.ilike.${like},short_description.ilike.${like}`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ProductSuggestion[];
}

export interface CartProductRow {
  id: string;
  name: string;
  price: number;
  price_with_exchange: number;
  price_without_exchange: number;
  has_exchange: boolean;
  stock: number;
  gst_rate_id: string | null;
}

/** Current price/stock for cart lines. Missing ids = removed or no longer active. */
export async function getCartProducts(ids: string[]): Promise<CartProductRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, price_with_exchange, price_without_exchange, has_exchange, stock, gst_rate_id")
    .in("id", ids)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as CartProductRow[];
}
