import { useState } from "react";
import {
  UsersToolbar,
  useFilteredUsers,
  EMPTY_USERS_FILTER,
  type UsersFilterState,
} from "./components/UsersToolbar";
import { UsersTable } from "./components/UsersTable";
import { InviteAdminDialog } from "./components/InviteAdminDialog";
import { useAdminUsersQuery } from "./hooks/useAdminUsers";

/**
 * AdminUsers (orchestrator)
 * ==============================================================
 * Lists every user, lets staff change roles inline, and lets
 * admins invite new admin/staff via `admin_create_admin_profile`.
 *
 * FILE MAP
 *   index.tsx                       ← this file
 *   components/
 *     UsersToolbar.tsx              ← search + role filter + invite btn
 *     UsersTable.tsx                ← list with inline role select
 *     InviteAdminDialog.tsx         ← invite-admin form
 *   hooks/useAdminUsers.ts          ← React Query hooks
 *
 * Filtering is done client-side because `admin_list_users` returns
 * the full set anyway (RLS protects it). Switch to server-side
 * if the dataset grows.
 */
const AdminUsers = () => {
  const [filters, setFilters] = useState<UsersFilterState>(EMPTY_USERS_FILTER);
  const [inviteOpen, setInviteOpen] = useState(false);
  const q = useAdminUsersQuery();
  const filtered = useFilteredUsers(q.data ?? [], filters);

  return (
    <div className="space-y-3">
      <UsersToolbar
        state={filters}
        onChange={setFilters}
        onInvite={() => setInviteOpen(true)}
        count={filtered.length}
      />
      <UsersTable rows={filtered} loading={q.isLoading} />
      <InviteAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
};

export default AdminUsers;
