# Troubleshooting

## "Row-level security policy violated"

The user is signed in, but no RLS policy grants them the action they
attempted. Either:

- Add an `INSERT` / `UPDATE` policy that matches `auth.uid()`, or
- Check that you set `user_id` on the row to the current user before insert.

Never bypass RLS by using a service role on the client. Move the logic to
an edge function if it genuinely needs elevated permissions.

## "useAuth returns null user even after sign-in"

`useAuth` returns `loading: true` until the initial session resolves. Gate
on `loading` first:

```tsx
const { user, loading } = useAuth();
if (loading) return null;
if (!user) return <Navigate to="/auth" />;
```

## Stale data after a mutation

You forgot to invalidate. In the mutation hook's `onSuccess`, add:

```ts
qc.invalidateQueries({ queryKey: qk.<domain>.<scope> });
```

If you're not sure which key, broaden it: `qk.<domain>.all`.

## "Cannot find module './pages/Foo'" after a folder split

Folder + `index.tsx` resolves the same as `Foo.tsx`, but only if you
deleted the old file. After moving, `rm src/pages/Foo.tsx` so the bundler
doesn't get two candidates.

## A query returns at most 1000 rows

Supabase's default cap. Add `.range(0, 9999)` or paginate. Don't assume a
silent truncation is a bug elsewhere.

## Phone gate redirect loop

`<RequirePhoneVerified />` checks `user.phone` and `user.phone_confirmed_at`.
If you signed up via Google and skipped phone, you'll bounce to
`/add-phone`. That's correct — collect the phone or sign out.

## Admin dashboard says "forbidden"

The signed-in user has no row in `public.user_roles` with role `admin` or
`staff`. Insert one via a migration or the SQL editor:

```sql
insert into public.user_roles (user_id, role)
values ('<the user uuid>', 'admin');
```
