import { supabase } from "../client";

export interface OrderStatusCount {
  status: string;
  value: number;
}

export async function getOrderStatusCounts(): Promise<OrderStatusCount[]> {
  const { data, error } = await supabase.rpc("admin_order_status_counts");
  if (error) throw error;
  return (data ?? []) as OrderStatusCount[];
}

export interface StorageUsageRow {
  bucket_id: string;
  file_count: number;
  total_bytes: number;
}

export async function getStorageUsage(): Promise<StorageUsageRow[]> {
  const { data, error } = await supabase.rpc("admin_storage_usage");
  if (error) throw error;
  return (data ?? []) as StorageUsageRow[];
}
