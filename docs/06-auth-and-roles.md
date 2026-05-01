# Auth & roles

## Three checks, three guards

| Question                  | Hook / Guard                  | Where it lives |
| ------------------------- | ----------------------------- | -------------- |
| Is the user signed in?    | `useAuth()`                   | `src/hooks/useAuth.ts` |
| Has the user verified their phone? | `<RequirePhoneVerified />` route element | `src/components/auth/` |
| Is the user an admin/staff? | `<RequireStaff />`          | `src/components/auth/` |

## `useAuth()`

Subscribes to Supabase auth state. Returns `{ user, session, loading }`.
Use it anywhere you need the current user id.

```tsx
const { user } = useAuth();
if (!user) return <Navigate to="/auth" />;
```

## Phone verification gate

`/checkout` and `/account` are wrapped in `<RequirePhoneVerified />`. The
guard:

1. Sends unauthenticated users to `/auth`.
2. Sends authenticated users without a phone to `/add-phone`.
3. Sends authenticated users with an unverified phone to `/verify-phone`.
4. Renders `<Outlet />` for everyone who passes.

Keep this guard; it's how we ensure orders have a callable phone number.

## Admin gate

The admin tree (`/admin/*`) is gated by `<RequireStaff />`, which calls the
`has_role(user_id, 'admin'|'staff')` Postgres function via `src/api/admin/`.

**Never** check admin status from a column on the `profiles` table or from
`localStorage`. Roles live in the dedicated `user_roles` table and are read
through the `has_role` security-definer function. This is a hard rule.

## Adding a new role

1. Add the value to the `app_role` enum via a migration:
   ```sql
   alter type public.app_role add value 'editor';
   ```
2. Insert rows into `public.user_roles` for users you want to grant.
3. Use `has_role(auth.uid(), 'editor')` in your RLS policies.
4. Add a guard component if you want a route-level check.
