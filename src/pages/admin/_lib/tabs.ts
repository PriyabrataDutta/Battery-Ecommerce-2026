import { lazy, type ComponentType } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  FolderTree,
  ShoppingBag,
  FileText,
  Mail,
  Settings,
  Users,
  Activity,
  Car,
  ImageIcon,
} from "lucide-react";
import type { AdminTab } from "@/stores/dashboardTabs";

export interface AdminTabDef {
  id: AdminTab;
  title: string;
  sidebarLabel: string;
  icon: ComponentType<{ className?: string }>;
  section: "overview" | "ecommerce" | "catalog" | "content" | "admin";
  component: ReturnType<typeof lazy>;
}

export const ADMIN_TAB_DEFS: AdminTabDef[] = [
  // ─── Overview ───
  {
    id: "dashboard",
    title: "Sales Dashboard",
    sidebarLabel: "Dashboard",
    icon: LayoutDashboard,
    section: "overview",
    component: lazy(() => import("@/pages/admin/Dashboard")),
  },

  // ─── E-Commerce ───
  {
    id: "orders",
    title: "Orders",
    sidebarLabel: "Orders",
    icon: ShoppingBag,
    section: "ecommerce",
    component: lazy(() => import("@/pages/admin/orders")),
  },
  {
    id: "quotes",
    title: "Quote Requests",
    sidebarLabel: "Quotes",
    icon: FileText,
    section: "ecommerce",
    component: lazy(() => import("@/pages/admin/quotes")),
  },
  {
    id: "messages",
    title: "Contact Messages",
    sidebarLabel: "Messages",
    icon: Mail,
    section: "ecommerce",
    component: lazy(() => import("@/pages/admin/messages")),
  },

  // ─── Product Catalog ───
  {
    id: "products",
    title: "Products",
    sidebarLabel: "Products",
    icon: Package,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/products")),
  },
  {
    id: "brands",
    title: "Brands",
    sidebarLabel: "Brands",
    icon: Tags,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/brands")),
  },
  {
    id: "categories",
    title: "Categories",
    sidebarLabel: "Categories",
    icon: FolderTree,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/categories")),
  },
  {
    id: "fitment",
    title: "Car Fitment",
    sidebarLabel: "Car Fitment",
    icon: Car,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/fitment")),
  },

  // ─── Content & Media ───
  {
    id: "media",
    title: "Media Gallery",
    sidebarLabel: "Media",
    icon: ImageIcon,
    section: "content",
    component: lazy(() => import("@/pages/admin/media")),
  },

  // ─── Administration ───
  {
    id: "users",
    title: "Users",
    sidebarLabel: "Users",
    icon: Users,
    section: "admin",
    component: lazy(() => import("@/pages/admin/users")),
  },
  {
    id: "settings",
    title: "Settings",
    sidebarLabel: "Settings",
    icon: Settings,
    section: "admin",
    component: lazy(() => import("@/pages/admin/settings")),
  },
  {
    id: "audit-log",
    title: "Admin Audit Log",
    sidebarLabel: "Audit Log",
    icon: Activity,
    section: "admin",
    component: lazy(() => import("@/pages/admin/AuditLog")),
  },
];

/** Quick lookup by tab ID */
export const TAB_MAP = Object.fromEntries(
  ADMIN_TAB_DEFS.map((t) => [t.id, t]),
) as Record<AdminTab, AdminTabDef>;

/** Sections for sidebar rendering */
export const SIDEBAR_SECTIONS = [
  { label: "Overview", key: "overview" as const },
  { label: "E-Commerce", key: "ecommerce" as const },
  { label: "Product Catalog", key: "catalog" as const },
  { label: "Content & Media", key: "content" as const },
  { label: "Administration", key: "admin" as const },
] as const;
