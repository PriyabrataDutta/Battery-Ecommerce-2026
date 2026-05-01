# Admin · Users

Lists every user, lets staff change roles inline, and lets admins invite new admin/staff.

## Files
- `index.tsx` — orchestrator
- `components/UsersToolbar.tsx` — search + role filter + invite button
- `components/UsersTable.tsx` — list with inline role `<Select>`
- `components/InviteAdminDialog.tsx` — invite-admin form
- `hooks/useAdminUsers.ts` — React Query hooks

## Permissions
- `useSetUserRole` calls `admin_set_user_role` (RPC). Only admins can grant `admin`.
- `useInviteAdmin` calls `admin_create_admin_profile` (RPC). Admin-only.

## Filtering
Done client-side via `useFilteredUsers`. Switch to server-side if the dataset grows
(add params to `admin_list_users` and to `useAdminUsersQuery`).
