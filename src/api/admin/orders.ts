import { supabase } from "../client";
import { logActivity } from "@/lib/adminLog";

/**
 * Admin Orders API
 * --------------------------------------------------------------
 * Read + status-mutation endpoints for the admin Orders panel.
 * Customer-facing order reads/writes live in `src/api/orders.ts`
 * — keep that boundary clean.
 */

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface AdminOrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  payment_method: string | null;
  payment_status: "unpaid" | "paid" | "failed" | "refunded";
  payment_ref: string | null;
  paid_at: string | null;
  delivery_label: string | null;
  scheduled_date: string | null;
  scheduled_slot_label: string | null;
  scheduled_slot_window: string | null;
  promo_code: string | null;
  notes: string | null;
  address: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ListAdminOrdersOptions {
  search?: string;
  status?: string;
  limit?: number;
}

export async function listAdminOrders(
  opts: ListAdminOrdersOptions = {},
): Promise<AdminOrderRow[]> {
  let q = supabase
    .from("orders")
    .select(
      "id, order_number, status, total, subtotal, discount, tax, shipping, customer_name, customer_email, customer_phone, payment_method, payment_status, payment_ref, paid_at, delivery_label, scheduled_date, scheduled_slot_label, scheduled_slot_window, promo_code, notes, address, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.status) q = q.eq("status", opts.status as never);
  if (opts.search) {
    const like = `%${opts.search}%`;
    q = q.or(
      `order_number.ilike.${like},customer_name.ilike.${like},customer_email.ilike.${like},customer_phone.ilike.${like}`,
    );
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdminOrderRow[];
}

export interface AdminOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  qty: number;
  unit_price: number;
  gst_rate: number | null;
  tax_amount: number | null;
}

export async function getAdminOrderItems(orderId: string): Promise<AdminOrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, product_sku, qty, unit_price, gst_rate, tax_amount")
    .eq("order_id", orderId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as AdminOrderItem[];
}

export async function setOrderStatus(orderId: string, status: OrderStatus, prev: string): Promise<void> {
  const { error } = await supabase.from("orders").update({ status: status as never }).eq("id", orderId);
  if (error) throw error;
  await logActivity("order.status_change", "order", orderId, { from: prev, to: status });
}

export async function setOrderNotes(orderId: string, notes: string): Promise<void> {
  const { error } = await supabase.from("orders").update({ notes }).eq("id", orderId);
  if (error) throw error;
  await logActivity("order.notes_update", "order", orderId, {});
}
