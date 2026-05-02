import { supabase } from "./client";

export interface ReturnRequest {
  id: string;
  order_id: string;
  order_item_id: string | null;
  user_id: string;
  reason: string;
  description: string | null;
  status: "requested" | "staff_verified" | "admin_approved" | "rejected" | "completed";
  staff_verified_by: string | null;
  staff_verified_at: string | null;
  admin_decided_by: string | null;
  admin_decided_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  return_images?: { id: string; url: string }[];
}

export async function listMyReturns(userId: string): Promise<ReturnRequest[]> {
  const { data, error } = await supabase
    .from("return_requests")
    .select("*, return_images(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReturnRequest[];
}

export async function createReturnRequest(req: {
  order_id: string;
  order_item_id?: string;
  user_id: string;
  reason: string;
  description?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("return_requests")
    .insert(req)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function uploadReturnImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("return-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("return-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function addReturnImage(returnId: string, url: string) {
  const { error } = await supabase
    .from("return_images")
    .insert({ return_id: returnId, url });
  if (error) throw error;
}

export async function listAllReturns(status?: string): Promise<ReturnRequest[]> {
  let q = supabase
    .from("return_requests")
    .select("*, return_images(*)")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status as any);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ReturnRequest[];
}

export async function updateReturnStatus(
  id: string,
  status: ReturnRequest["status"],
  extras?: { staff_verified_by?: string; admin_decided_by?: string; admin_notes?: string },
) {
  const update: any = { status };
  if (status === "staff_verified") {
    update.staff_verified_by = extras?.staff_verified_by;
    update.staff_verified_at = new Date().toISOString();
  }
  if (["admin_approved", "rejected", "completed"].includes(status)) {
    update.admin_decided_by = extras?.admin_decided_by;
    update.admin_decided_at = new Date().toISOString();
    if (extras?.admin_notes) update.admin_notes = extras.admin_notes;
  }
  const { error } = await supabase.from("return_requests").update(update).eq("id", id);
  if (error) throw error;
}
