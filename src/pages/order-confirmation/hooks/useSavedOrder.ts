import { useEffect, useState } from "react";
import { ORDER_STORAGE_KEY, type SavedOrder } from "../lib/types";

/**
 * useSavedOrder
 * --------------------------------------------------------------
 * Reads the most recent order snapshot written by the Checkout
 * flow into `sessionStorage`. Returns:
 *   • undefined → still loading (initial mount, before effect)
 *   • null      → no order found (user landed here directly)
 *   • SavedOrder → parsed order payload
 *
 * Splitting this out keeps the page component pure-presentational
 * and makes it trivial to swap the data source later (e.g. to a
 * `useOrderById` query hook) without touching the UI.
 */
export function useSavedOrder() {
  const [order, setOrder] = useState<SavedOrder | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);
      setOrder(raw ? (JSON.parse(raw) as SavedOrder) : null);
    } catch {
      setOrder(null);
    }
  }, []);

  return order;
}
