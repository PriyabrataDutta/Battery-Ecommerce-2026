/**
 * Order confirmation — shared types
 * --------------------------------------------------------------
 * `SavedOrder` is the snapshot the Checkout flow writes to
 * `sessionStorage` (`kachi_last_order`) after a successful order
 * placement. The OrderConfirmation page reads it back and uses
 * the typed shape below — keep this in sync with the writer in
 * `src/pages/checkout/index.tsx`.
 */

export interface SavedOrder {
  orderNumber: string;
  placedAt: string;
  items: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string;
    image: string | null;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    withExchange?: boolean;
  }>;
  address: {
    fullName: string;
    phone: string;
    email: string;
    line1: string;
    line2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    notes: string;
  };
  delivery: { id: string; label: string; eta: string; price: number };
  schedule?: {
    date: string;
    dateLabel: string;
    slot: string;
    slotLabel: string;
    slotWindow: string;
  };
  payment: { id: string; label: string; hint: string };
  totals: {
    subtotal: number;
    discount?: number;
    promo?: { code: string; label: string } | null;
    tax: number;
    shipping: number;
    /** GST per slab (rate %, amount) — absent on snapshots saved before this field existed. */
    gst?: { rate: number; amount: number }[];
    total: number;
  };
}

/** Key used for the sessionStorage handoff between Checkout → Confirmation. */
export const ORDER_STORAGE_KEY = "kachi_last_order";
