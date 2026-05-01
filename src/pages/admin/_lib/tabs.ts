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
} from "lucide-react";
import type { AdminTab } from "@/stores/dashboardTabs";

export interface AdminTabDef {
  id: AdminTab;
  title: string;
  sidebarLabel: string;
  icon: ComponentType<{ className?: string }>;
  section: "catalog" | "management" | "super-admin";
  component: ReturnType<typeof lazy>;
}

export const ADMIN_TAB_DEFS: AdminTabDef[] = [
  {
    id: "dashboard",
    title: "Sales Dashboard",
    icon: LayoutDashboard,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/Dashboard")),
  },
  {
    id: "products",
    title: "Products",
    icon: Package,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/products")),
  },
  {
    id: "brands",
    title: "Brands",
    icon: Tags,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/brands")),
  },
  {
    id: "categories",
    title: "Categories",
    icon: FolderTree,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/categories")),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    section: "catalog",
    component: lazy(() => import("@/pages/admin/settings")),
  },
  {
    id: "users",
    title: "Users",
    icon: Users,
    section: "management",
    component: lazy(() => import("@/pages/admin/users")),
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingBag,
    section: "management",
    component: lazy(() => import("@/pages/admin/orders")),
  },
  {
    id: "quotes",
    title: "Quote Requests",
    icon: FileText,
    section: "management",
    component: lazy(() => import("@/pages/admin/quotes")),
  },
  {
    id: "messages",
    title: "Contact Messages",
    icon: Mail,
    section: "management",
    component: lazy(() => import("@/pages/admin/messages")),
  },
  {
    id: "audit-log",
    title: "Admin Audit Log",
    icon: Activity,
    section: "super-admin",
    component: lazy(() => import("@/pages/admin/AuditLog")),
  },
];

/** Quick lookup by tab ID */
export const TAB_MAP = Object.fromEntries(
  ADMIN_TAB_DEFS.map((t) => [t.id, t]),
) as Record<AdminTab, AdminTabDef>;

/** Sections for sidebar rendering */
export const SIDEBAR_SECTIONS = [
  { label: "Catalog", key: "catalog" as const },
  { label: "Management", key: "management" as const },
  { label: "Super Admin", key: "super-admin" as const },
] as const;
