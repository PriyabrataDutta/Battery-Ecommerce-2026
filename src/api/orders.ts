import { supabase } from "./client";

export interface OrderItemInput {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  qty: number;
  unit_price: number;
}

export interface CreateOrderInput {
  userId: string;
  orderNumber: string;
  customer: { name: string; email: string; phone: string };
  /** Full address blob — stored as JSON on the order. */
  address: Record<string, unknown>;
  notes: string | null;

  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;

  promoCode: string | null;
  promoLabel: string | null;
  paymentMethod: string;

  deliveryMethod: string;
  deliveryLabel: string;

  scheduledDate: string; // YYYY-MM-DD
  scheduledSlot: string;
  scheduledSlotLabel: string;
  scheduledSlotWindow: string;

  items: OrderItemInput[];
}

export interface CreatedOrder {
  id: string;
  order_number: string | null;
}

/**
 * Persist an order in two writes (header, then items). RLS enforces that
 * `user_id` matches the authenticated user.
 *
 * Throws on any database error so the caller can surface a toast and stop.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert([{
      user_id: input.userId,
      order_number: input.orderNumber,
      status: "pending",
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone,
      address: input.address,
      notes: input.notes,
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      shipping: input.shipping,
      total: input.total,
      promo_code: input.promoCode,
      promo_label: input.promoLabel,
      payment_method: input.paymentMethod,
      delivery_method: input.deliveryMethod,
      delivery_label: input.deliveryLabel,
      scheduled_date: input.scheduledDate,
      scheduled_slot: input.scheduledSlot,
      scheduled_slot_label: input.scheduledSlotLabel,
      scheduled_slot_window: input.scheduledSlotWindow,
    })
    .select("id, order_number")
    .single();

  if (orderErr || !orderRow) {
    throw orderErr ?? new Error("Could not create order");
  }

  const itemRows = input.items.map((it) => ({
    order_id: orderRow.id,
    product_id: it.product_id,
    product_name: it.product_name,
    product_sku: it.product_sku,
    qty: it.qty,
    unit_price: it.unit_price,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    // The header was inserted but items failed — surface this so the UI can
    // tell the user their order was placed but items didn't save.
    const e = new Error("Order placed but items failed to save: " + itemsErr.message);
    (e as Error & { code: string }).code = "ORDER_ITEMS_FAILED";
    throw e;
  }

  return orderRow;
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
