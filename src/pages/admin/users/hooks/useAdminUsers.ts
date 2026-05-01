import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminUsers,
  setUserRole,
  inviteAdmin,
} from "@/api/admin/users";

export const ADMIN_USERS_KEY = ["admin", "users"] as const;

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: ADMIN_USERS_KEY,
    queryFn: listAdminUsers,
    staleTime: 10_000,
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "staff" | "customer";
    }) => setUserRole(userId, role),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update role"),
  });
}

export function useInviteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      full_name?: string;
      phone?: string;
      role?: "admin" | "staff";
    }) => inviteAdmin(input),
    onSuccess: () => {
      toast.success("Admin invited", {
        description: "They'll appear once they sign in with that email.",
      });
      qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not invite admin"),
  });
}
