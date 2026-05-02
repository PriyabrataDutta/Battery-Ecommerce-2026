import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tab keys used by the customer dashboard. Persisted so the user lands on the
 * same tab after a refresh.
 */
export const ACCOUNT_TABS = [
  "overview",
  "orders",
  "addresses",
  "wishlist",
  "quotes",
  "support",
  "profile",
] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number];
export const isAccountTab = (v: unknown): v is AccountTab =>
  typeof v === "string" && (ACCOUNT_TABS as readonly string[]).includes(v);

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
export const ADMIN_TABS = [
  "dashboard",
  "products",
  "brands",
  "categories",
  "fitment",
  "media",
  "reviews",
  "returns",
  "settings",
  "team",
  "customers",
  "orders",
  "quotes",
  "messages",
  "audit-log",
] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];
export const isAdminTab = (v: unknown): v is AdminTab =>
  typeof v === "string" && (ADMIN_TABS as readonly string[]).includes(v);

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
