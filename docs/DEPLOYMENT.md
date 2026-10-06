# Deployment & Superadmin Setup

## A. Publish on Lovable
1. Click **Publish** (top right) → **Update** to push frontend changes live.
2. Backend changes (database, functions) go live automatically.
3. Custom domain: Project Settings → Domains → Add domain, then add the DNS records shown.

## B. Create a superadmin user

Roles live in the `user_roles` table (`admin`, `staff`, `customer`). Never store roles on profiles.
The `handle_new_user` trigger links any sign-up whose email exists in `admin_profiles`.

### Option 1 — Lovable Cloud (this project)
1. Open **Cloud → Database → SQL editor** (or ask the Lovable agent to run it).
2. Pre-register the email:
   ```sql
   insert into public.admin_profiles (id, email, full_name, is_active)
   values (gen_random_uuid(), 'owner@example.com', 'Owner Name', true)
   on conflict do nothing;
   ```
3. Go to `/auth` (or `/admin/login`) and sign up / reset password with that email. Confirm the email.
4. Promote to admin:
   ```sql
   delete from public.user_roles
    where user_id = (select id from auth.users where lower(email)=lower('owner@example.com'));
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where lower(email)=lower('owner@example.com');
   ```
5. Sign in at `/admin/login`. Admins automatically have every permission.

### Option 2 — Self-hosted Supabase
1. Supabase Dashboard → **Authentication → Users → Add user** → enter email + password, tick *Auto confirm*.
2. **SQL Editor** → run steps 2 (optional) and 4 above.
3. Verify:
   ```sql
   select u.email, r.role from auth.users u join public.user_roles r on r.user_id=u.id
   where r.role='admin';
   ```

### Adding more team members later
Admin → Team → **Invite**, choose role (admin/staff), then set permissions or apply a preset. The person signs up with the invited email.

### Lost password
`/admin/login` → enter email → **Forgot password?** → follow the email link. Change it anytime in Admin → Settings → Security.

## C. Self-hosting (optional)
1. Connect GitHub (+ menu → GitHub → Connect project); code syncs automatically.
2. `npm install && npm run build` → deploy `dist/` to any static host (Vercel, Netlify, Nginx) with SPA fallback to `index.html`.
3. Set env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
4. Apply `supabase/migrations` with `supabase db push`, deploy functions with `supabase functions deploy`.
