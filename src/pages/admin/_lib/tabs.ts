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
  UserCheck,
  Activity,
  Car,
  ImageIcon,
  Star,
  RotateCcw,
} from "lucide-react";
import type { AdminTab } from "@/stores/dashboardTabs";
import type { PermissionKey } from "@/hooks/usePermissions";

export interface AdminTabDef {
  id: AdminTab;
  title: string;
  sidebarLabel: string;
  icon: ComponentType<{ className?: string }>;
  section: "overview" | "ecommerce" | "catalog" | "content" | "admin";
  requiredPermission: PermissionKey;
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
    requiredPermission: "dashboard.view",
    component: lazy(() => import("@/pages/admin/Dashboard")),
  },

  // ─── E-Commerce ───
  {
    id: "orders",
    title: "Orders",
    sidebarLabel: "Orders",
    icon: ShoppingBag,
    section: "ecommerce",
    requiredPermission: "orders.manage",
    component: lazy(() => import("@/pages/admin/orders")),
  },
  {
    id: "quotes",
    title: "Quote Requests",
    sidebarLabel: "Quotes",
    icon: FileText,
    section: "ecommerce",
    requiredPermission: "quotes.manage",
    component: lazy(() => import("@/pages/admin/quotes")),
  },
  {
    id: "messages",
    title: "Contact Messages",
    sidebarLabel: "Messages",
    icon: Mail,
    section: "ecommerce",
    requiredPermission: "messages.manage",
    component: lazy(() => import("@/pages/admin/messages")),
  },
  {
    id: "customers",
    title: "Customers",
    sidebarLabel: "Customers",
    icon: UserCheck,
    section: "ecommerce",
    requiredPermission: "customers.view",
    component: lazy(() => import("@/pages/admin/customers")),
  },

  // ─── Product Catalog ───
  {
    id: "products",
    title: "Products",
    sidebarLabel: "Products",
    icon: Package,
    section: "catalog",
    requiredPermission: "products.manage",
    component: lazy(() => import("@/pages/admin/products")),
  },
  {
    id: "brands",
    title: "Brands",
    sidebarLabel: "Brands",
    icon: Tags,
    section: "catalog",
    requiredPermission: "brands.manage",
    component: lazy(() => import("@/pages/admin/brands")),
  },
  {
    id: "categories",
    title: "Categories",
    sidebarLabel: "Categories",
    icon: FolderTree,
    section: "catalog",
    requiredPermission: "categories.manage",
    component: lazy(() => import("@/pages/admin/categories")),
  },
  {
    id: "fitment",
    title: "Car Fitment",
    sidebarLabel: "Car Fitment",
    icon: Car,
    section: "catalog",
    requiredPermission: "fitment.manage",
    component: lazy(() => import("@/pages/admin/fitment")),
  },

  // ─── Content & Media ───
  {
    id: "media",
    title: "Media Gallery",
    sidebarLabel: "Media",
    icon: ImageIcon,
    section: "content",
    requiredPermission: "media.manage",
    component: lazy(() => import("@/pages/admin/media")),
  },
  {
    id: "reviews",
    title: "Product Reviews",
    sidebarLabel: "Reviews",
    icon: Star,
    section: "content",
    requiredPermission: "reviews.manage",
    component: lazy(() => import("@/pages/admin/reviews")),
  },
  {
    id: "returns",
    title: "Product Returns",
    sidebarLabel: "Returns",
    icon: RotateCcw,
    section: "ecommerce",
    requiredPermission: "returns.manage",
    component: lazy(() => import("@/pages/admin/returns")),
  },

  // ─── Administration ───
  {
    id: "team",
    title: "Team Management",
    sidebarLabel: "Team",
    icon: Users,
    section: "admin",
    requiredPermission: "users.manage",
    component: lazy(() => import("@/pages/admin/users")),
  },
  {
    id: "settings",
    title: "Settings",
    sidebarLabel: "Settings",
    icon: Settings,
    section: "admin",
    requiredPermission: "settings.manage",
    component: lazy(() => import("@/pages/admin/settings")),
  },
  {
    id: "audit-log",
    title: "Admin Audit Log",
    sidebarLabel: "Audit Log",
    icon: Activity,
    section: "admin",
    requiredPermission: "audit_log.view",
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
