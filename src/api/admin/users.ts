import { supabase } from "../client";

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  roles: string[];
  created_at: string;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return (data ?? []) as AdminUserRow[];
}

export async function setUserRole(userId: string, role: "admin" | "staff" | "customer"): Promise<void> {
  const { error } = await supabase.rpc("admin_set_user_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) throw error;
}

export async function inviteAdmin(input: {
  email: string;
  full_name?: string;
  phone?: string;
  role?: "admin" | "staff";
}): Promise<string> {
  const { data, error } = await supabase.rpc("admin_create_admin_profile", {
    _email: input.email,
    _full_name: input.full_name ?? null,
    _phone: input.phone ?? null,
    _role: input.role ?? "staff",
  });
  if (error) throw error;
  return data as string;
}
