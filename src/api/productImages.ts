import { supabase } from "./client";

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, alt, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductImage[];
}
