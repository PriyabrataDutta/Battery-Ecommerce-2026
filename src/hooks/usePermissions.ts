import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/** All permission keys used in the admin panel */
export const ALL_PERMISSIONS = [
  "dashboard.view",
  "orders.manage",
  "quotes.manage",
  "messages.manage",
  "customers.view",
  "products.manage",
  "brands.manage",
  "categories.manage",
  "fitment.manage",
  "media.manage",
  "reviews.manage",
  "users.manage",
  "settings.manage",
  "audit_log.view",
] as const;

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "dashboard.view": "View Dashboard",
  "orders.manage": "Manage Orders",
  "quotes.manage": "Manage Quotes",
  "messages.manage": "Manage Messages",
  "customers.view": "View Customers",
  "products.manage": "Manage Products",
  "brands.manage": "Manage Brands",
  "categories.manage": "Manage Categories",
  "fitment.manage": "Manage Car Fitment",
  "media.manage": "Manage Media",
  "users.manage": "Manage Team",
  "settings.manage": "Manage Settings",
  "audit_log.view": "View Audit Log",
};

/** Group permissions for the editor UI */
export const PERMISSION_GROUPS = [
  { label: "Overview", keys: ["dashboard.view"] as PermissionKey[] },
  { label: "E-Commerce", keys: ["orders.manage", "quotes.manage", "messages.manage", "customers.view"] as PermissionKey[] },
  { label: "Product Catalog", keys: ["products.manage", "brands.manage", "categories.manage", "fitment.manage"] as PermissionKey[] },
  { label: "Content & Media", keys: ["media.manage"] as PermissionKey[] },
  { label: "Administration", keys: ["users.manage", "settings.manage", "audit_log.view"] as PermissionKey[] },
];

async function fetchMyPermissions(): Promise<Set<PermissionKey>> {
  const { data, error } = await supabase
    .from("staff_permissions")
    .select("permission");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.permission as PermissionKey));
}

async function fetchUserPermissions(userId: string): Promise<Set<PermissionKey>> {
  const { data, error } = await supabase
    .from("staff_permissions")
    .select("permission")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.permission as PermissionKey));
}

/**
 * Returns the set of permissions the current user has.
 * Admins get ALL permissions automatically.
 */
export function useMyPermissions() {
  const { user, isStaff, loading: authLoading } = useAuth();

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["my-is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
    enabled: !!user && isStaff,
    staleTime: 5 * 60_000,
  });

  const { data: perms, isLoading } = useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: fetchMyPermissions,
    enabled: !!user && isStaff && isAdmin === false,
    staleTime: 60_000,
  });

  // Admins get everything
  if (isAdmin) {
    return {
      permissions: new Set(ALL_PERMISSIONS) as Set<PermissionKey>,
      isAdmin: true,
      loading: authLoading,
    };
  }

  return {
    permissions: perms ?? new Set<PermissionKey>(),
    isAdmin: false,
    loading: authLoading || isLoading,
  };
}

/** Check a single permission */
export function useHasPermission(key: PermissionKey): boolean {
  const { permissions } = useMyPermissions();
  return permissions.has(key);
}

/** Fetch permissions for a specific user (admin use) */
export function useUserPermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => fetchUserPermissions(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
