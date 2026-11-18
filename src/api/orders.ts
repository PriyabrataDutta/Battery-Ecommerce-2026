import { supabase } from "./client";

/** What the server needs to price a cart — never prices. */
export interface CartLineInput {
  product_id: string;
  qty: number;
  with_exchange: boolean;
}

/** Server-computed pricing (see supabase/migrations/*_server_side_orders.sql). */
export interface OrderQuote {
  lines: Array<{
    product_id: string;
    name: string;
    sku: string | null;
    slug: string;
    qty: number;
    with_exchange: boolean;
    unit_price: number;
    line_total: number;
    gst_rate: number;
    tax: number;
  }>;
  subtotal: number;
  discount: number;
  promo: { code: string; label: string } | null;
  promo_error: string | null;
  /** GST already included in the prices (not added on top). */
  tax: number;
  shipping: number;
  delivery: { id: string; label: string };
  /** Total is rounded to the rupee; this is the difference (shown as "Round off"). */
  round_off: number;
  total: number;
}

export interface PlacedOrder extends OrderQuote {
  order_id: string;
  order_number: string;
  payment_label: string;
}

export async function quoteOrder(
  items: CartLineInput[],
  delivery: string,
  promo: string | null,
): Promise<OrderQuote> {
  const { data, error } = await supabase.rpc("quote_order", {
    p_items: items as never,
    p_delivery: delivery,
    p_promo: promo ?? undefined,
  });
  if (error) throw error;
  return data as unknown as OrderQuote;
}

export interface PlaceOrderInput {
  items: CartLineInput[];
  delivery: string;
  promo: string | null;
  payment: string;
  address: Record<string, unknown>;
  scheduledDate: string; // YYYY-MM-DD
  slot: string;
  slotLabel: string;
  slotWindow: string;
  /** Same key for a retried attempt → the server returns the existing order. */
  idempotencyKey: string;
}

/** Prices, reserves stock and writes the order + items in one transaction. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc("place_order", {
    p_items: input.items as never,
    p_delivery: input.delivery,
    p_promo: input.promo ?? "",
    p_payment: input.payment,
    p_address: input.address as never,
    p_scheduled_date: input.scheduledDate,
    p_slot: input.slot,
    p_slot_label: input.slotLabel,
    p_slot_window: input.slotWindow,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data as unknown as PlacedOrder;
}

export interface OrderListRow {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  promo_code: string | null;
  delivery_label: string | null;
  scheduled_date: string | null;
  scheduled_slot_label: string | null;
  scheduled_slot_window: string | null;
  created_at: string;
}

export async function listMyOrders(userId: string): Promise<OrderListRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total, subtotal, discount, tax, shipping, promo_code, delivery_label, scheduled_date, scheduled_slot_label, scheduled_slot_window, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrderListRow[];
}

export interface RecentOrderRow {
  id: string;
  order_number: string | null;
  status: string;
  total: number;
  created_at: string;
}

export interface OverviewSummary {
  recentOrders: RecentOrderRow[];
  counts: {
    orders: number;
    addresses: number;
    wishlist: number;
    quotes: number;
  };
}

/**
 * One-shot fetch for the Account Overview tiles + recent orders list.
 * Uses a single Promise.all for parallelism.
 */
export async function getOverviewSummary(userId: string, userEmail: string | null): Promise<OverviewSummary> {
  const [o, addr, wish, q] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("customer_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("wishlist_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", userEmail ?? ""),
  ]);
  return {
    recentOrders: (o.data ?? []) as RecentOrderRow[],
    counts: {
      orders: o.count ?? 0,
      addresses: addr.count ?? 0,
      wishlist: wish.count ?? 0,
      quotes: q.count ?? 0,
    },
  };
}
