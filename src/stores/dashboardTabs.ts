import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tab keys used by the customer dashboard. Persisted so the user lands on the
 * same tab after a refresh.
 */
export type AccountTab =
  | "overview"
  | "orders"
  | "addresses"
  | "wishlist"
  | "quotes"
  | "support"
  | "profile";

interface AccountTabState {
  tab: AccountTab;
  setTab: (tab: AccountTab) => void;
}

export const useAccountTab = create<AccountTabState>()(
  persist(
    (set) => ({
      tab: "overview",
      setTab: (tab) => set({ tab }),
    }),
    { name: "account-tab" },
  ),
);

/**
 * Tab keys used by the admin dashboard.
 */
export type AdminTab =
  | "dashboard"
  | "products"
  | "brands"
  | "categories"
  | "settings"
  | "users"
  | "orders"
  | "quotes"
  | "messages"
  | "audit-log";

interface AdminTabState {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
}

export const useAdminTab = create<AdminTabState>()(
  persist(
    (set) => ({
      tab: "dashboard",
      setTab: (tab) => set({ tab }),
    }),
    { name: "admin-tab" },
  ),
);
