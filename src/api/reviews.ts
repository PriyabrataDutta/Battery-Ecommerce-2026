import { supabase } from "./client";

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  review_images?: ReviewImage[];
  profiles?: { full_name: string | null } | null;
}

export interface ReviewImage {
  id: string;
  review_id: string;
  url: string;
  sort_order: number;
}

export async function listApprovedReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, review_images(*), profiles(full_name)")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProductReview[];
}

export async function getReviewStats(productId: string): Promise<{ avg: number; count: number }> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved");
  if (error) throw error;
  const ratings = (data ?? []).map((r: any) => r.rating);
  if (ratings.length === 0) return { avg: 0, count: 0 };
  return {
    avg: ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length,
    count: ratings.length,
  };
}

export async function createReview(review: {
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("product_reviews")
    .insert(review)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function uploadReviewImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("review-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("review-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function addReviewImage(reviewId: string, url: string, sortOrder: number) {
  const { error } = await supabase
    .from("review_images")
    .insert({ review_id: reviewId, url, sort_order: sortOrder });
  if (error) throw error;
}

/** Admin: list all reviews with optional status filter */
export async function listAllReviews(status?: string): Promise<ProductReview[]> {
  let q = supabase
    .from("product_reviews")
    .select("*, review_images(*), profiles(full_name)")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status as "pending" | "approved" | "rejected");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ProductReview[];
}

/** Admin: update review status */
export async function updateReviewStatus(id: string, status: "approved" | "rejected") {
  const { error } = await supabase
    .from("product_reviews")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}
