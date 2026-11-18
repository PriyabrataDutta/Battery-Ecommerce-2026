# Deployment & Superadmin Setup

## A. Publish on Lovable
1. Click **Publish** (top right) → **Update** to push frontend changes live.
2. Backend changes (database, functions) go live automatically.
3. Custom domain: Project Settings → Domains → Add domain, then add the DNS records shown.

## B. Create a superadmin user

Roles live in the `user_roles` table (`admin`, `staff`, `customer`). Never store roles on profiles.
The `handle_new_user` trigger links any sign-up whose email exists in `admin_profiles`.

### Option 1 — Lovable Cloud (this project)
If this project already has a Super Admin, add more people through **Admin → Team → Invite**.
For a first Super Admin on a separately purchased Supabase project, follow section C8;
do not create an `admin_profiles` row with a random ID. That table's ID must match an
existing authentication user.

### Option 2 — Your own Supabase account
Use this once you have a Supabase project you bought yourself. The full
step-by-step (create project, push schema, buckets, functions, secrets, auth,
superadmin, data move) is in **section C** below. Short version:

1. Supabase Dashboard → **Authentication → Users → Add user** → email + password, tick *Auto confirm*.
2. **SQL Editor** → run the `admin_profiles` insert and the `user_roles` promote from Option 1 above.
3. Verify:
   ```sql
   select u.email, r.role from auth.users u join public.user_roles r on r.user_id=u.id
   where r.role='admin';
   ```

### Adding more team members later
Admin → Team → **Invite**, choose role (admin/staff), then set permissions or apply a preset. The person signs up with the invited email.

### Lost password
`/admin/login` → enter email → **Forgot password?** → follow the email link. Change it anytime in Admin → Settings → Security.

## C. Deploying to your own Supabase account (new, purchased separately)

Use this when you buy a Supabase account of your own and want the site running on
that database instead of the one Lovable provisioned. No app code needs rewriting —
only three build-time values change, and the database, storage, functions and auth
settings are rebuilt once on the new project.

### What you are rebuilding

| Piece | What's in this project | How it moves |
| ----- | ---------------------- | ------------ |
| Tables, columns, RLS | 32 tables in `public` | `supabase db push` (29 migration files) |
| Enums | `app_role`, `order_status`, `request_status`, `review_status`, `return_status` | migrations |
| DB functions & triggers | `handle_new_user`, `is_staff`, `has_role`, `has_permission`, `verify_phone_code`, `admin_*` RPCs, audit triggers | migrations |
| Storage buckets | 8 buckets | 3 created by migrations, 5 by hand |
| Edge functions | 6 functions | `supabase functions deploy` |
| Auth settings | email provider, redirect URLs, SMTP | Dashboard, by hand |
| Catalog & customer data | products, fitment, orders, blog | CSV export → import |

### C1. Create the account and project

1. Sign up at **supabase.com** with your own billing — no Lovable involvement.
2. **New project**: name it (e.g. `kachi-prod`), set a strong database password
   and save it in a password manager; it is not recoverable.
3. Region: pick the one closest to your customers (for India, `ap-south-1` Mumbai).
   Region cannot be changed later without migrating data.
4. After provisioning, open **Project Settings → API Keys** and copy:
   - **Project URL** → `https://<new-ref>.supabase.co`
   - **publishable / anon key** → safe to ship in the browser
   - **secret / service_role key** → server-side only, never in the app bundle

### C2. Install the CLI and link the project

From the app repository folder, replace `YOUR_PROJECT_REF` with the new project's
reference (shown in its project URL):

```bash
npm install --global supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Then make `supabase/config.toml` match the new project:

```toml
project_id = "YOUR_PROJECT_REF"

[functions.client-ip]
verify_jwt = false

[functions.phone-login-lookup]
verify_jwt = false
```

Keep those two `verify_jwt = false` blocks — the storefront calls both functions
before anyone is signed in.

### C3. Point the app at the new database

The app reads three build-time values from `.env`:

```bash
VITE_SUPABASE_URL=https://<new-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<new publishable key>
VITE_SUPABASE_PROJECT_ID=<new-ref>
```

Restart the dev server after changing them. For a production build, set the same
three as host env vars (Vercel/Netlify) or bake them in before `npm run build`.

> **Heads-up while you still develop in Lovable:** the Lovable preview rebuilds
> `.env` from the Lovable Cloud connection, so the preview stays on the old
> backend. The new Supabase account is what your own build and host use. When you
> cut over for good, keep the code in Git and stop using Lovable Cloud.

### C4. Push the schema and security rules

```bash
supabase db push        # applies all 30 files in supabase/migrations, in order
```

This applies the schema, roles, database functions, triggers, and security policies.
The last migration also limits public settings and GST reads, hides media-library
metadata, and restricts quote-file uploads. The same policy update was applied to
Lovable Cloud from `drizzle/migrations/`; for the separately purchased project,
`supabase/migrations/` is the deployable copy. Confirm nothing was skipped:

```sql
select count(*) from information_schema.tables
 where table_schema = 'public';                                   -- expect 32

select typname from pg_type where typname in
  ('app_role','order_status','request_status','review_status','return_status');
                                                                 -- expect 5 rows

select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in ('is_staff','has_role','has_permission','admin_dashboard_summary');
                                                                 -- expect 4 rows
```

### C5. Storage buckets

All eight required buckets are created by the migrations. After `supabase db push`,
open **Storage → Buckets** and confirm the names and visibility below; do not create
duplicates.

| Bucket | Public | Used for |
| ------ | ------ | -------- |
| `blog` | yes | blog post images |
| `brand-logos` | yes | car and battery brand logos |
| `catalogs` | yes | downloadable PDF catalogues |
| `product-images` | yes | product gallery images |
| `quote-uploads` | no | customer quote attachments |
| `media` | yes | admin media library (created by migration) |
| `review-images` | yes | review photos (created by migration) |
| `return-images` | no | return-request photos (created by migration) |

Leave `return-images` and `quote-uploads` private — the owner-scoped policies and
signed URLs depend on them not being public.

### C6. Edge functions and their secrets

```bash
supabase functions deploy send-phone-verification-code
supabase functions deploy send-test-email
supabase functions deploy bulk-import-products
supabase functions deploy bulk-import-fitment
supabase functions deploy phone-login-lookup
supabase functions deploy client-ip
```

Then set the new project's own values in **Project Settings → Secrets** (or
`supabase secrets set`). The old project's secrets belong to the old project and
will fail here:

```bash
supabase secrets set \
  SUPABASE_URL=https://<new-ref>.supabase.co \
  SUPABASE_ANON_KEY=<new publishable key> \
  SUPABASE_SERVICE_ROLE_KEY=<new secret key>
```

### C7. Auth settings

1. **Authentication → Providers → Email**: enable. Leave *Confirm email* on
   unless you deliberately want auto-confirm.
2. **Authentication → URL Configuration**:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/**` and `http://localhost:8080/**`
3. Configure **Authentication SMTP** for confirmation and password-reset emails.
   The app's **Admin → Settings → Email/SMTP** stores separate settings used by its
   test-email function; it does not configure Authentication SMTP automatically.
   Use your own email provider credentials and never put a secret key in the app's
   public environment variables.
4. **Phone verification**: the code is stored hashed and checked by
   `verify_phone_code`. The included sender tries to call `send-transactional-email`,
   which is not one of the six functions in this repository. Configure/deploy a
   compatible email function (or connect an SMS provider) and test delivery before
   relying on phone verification in production.
5. **Google sign-in** is not wired up. If you want it, add the Google provider in
   the dashboard and a `signInWithOAuth` call in `src/pages/Auth.tsx`.

### C8. Create the first super admin

#### How this app's roles work

The migrations already create the role system; do not create a second role table
or add a role column to profiles. `public.user_roles` keeps roles separate from
profile data and supports `admin`, `staff`, and `customer`:

- `admin` is the app's Super Admin role. Admins can access all admin areas and
  manage team access.
- `staff` is for team members. Their access is controlled by rows in
  `public.staff_permissions`; saved permission templates are in
  `public.permission_presets`.
- `customer` is assigned to ordinary customer accounts.

The first Super Admin must be promoted once from the new project's SQL Editor,
because the in-app team invitation and admin-provisioning function require an
existing admin. Use the dashboard to create the account first, then run the SQL in
C8.3.

#### C8.1 Create the login

**Path A — dashboard (recommended the first time, no email needed)**

1. Supabase dashboard → **Authentication → Users → Add user**.
2. Enter the email and a strong password.
3. Tick **Auto confirm** — this skips the confirmation email, which matters if SMTP
   (section C7) isn't configured yet.
4. **Create user**.

**Path B — sign up through the site**

1. Open `/admin/login` (or `/auth`) and sign up with the email.
2. Click the link in the confirmation email.

Path B needs the Email provider switched on (C7) and a working mailer, and it gives
you a *customer* profile plus the `customer` role. C8.3 replaces that role and removes
the customer profile. Use Path A if possible; it avoids depending on confirmation
email delivery during initial setup.

#### C8.2 Where to run the SQL

**Project Settings → API Keys** gives you a connection string, or just use
**SQL Editor** in the dashboard. Both run as the database owner, so row-level security
does not block these writes. The publishable/anon key in the browser cannot do any of
this — don't try to run it from the site's console.

#### C8.3 Register and promote (run once, after the login exists)

Replace the email and name, then run this entire block once in the new project's SQL
Editor. It checks that the login exists before changing anything, so a typo will
produce a clear error instead of silently leaving you without access.

```sql
do $$
declare
  v_email text := lower('you@example.com');
  v_user_id uuid;
begin
  select id into v_user_id
    from auth.users
   where lower(email) = v_email;

  if v_user_id is null then
    raise exception 'No login found for %. Create the user first, then run this block again.', v_email;
  end if;

  -- Create or refresh the staff profile using the real authentication user ID.
  insert into public.admin_profiles (id, email, full_name, is_active)
  select id, email::text, 'Your Name', true
    from auth.users
   where id = v_user_id
  on conflict (id) do update
     set email = excluded.email,
         full_name = excluded.full_name,
         is_active = true;

  -- Replace the trigger-created customer role (if any) with the Super Admin role.
  delete from public.user_roles where user_id = v_user_id;
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin'::public.app_role);

  -- Keep team accounts out of the separate customer-profile list.
  delete from public.profiles where id = v_user_id;
end $$;
```

Use the same email address you created in C8.1. Replace `'Your Name'` with your
name. `admin_profiles.id` must match the existing `auth.users.id` because it is a
foreign key; do not use `gen_random_uuid()` here. The signup trigger may create a
customer profile and role automatically, which this block safely replaces.

#### C8.4 Verify

```sql
select u.email,
       r.role,
       ap.is_active,
       public.is_staff(u.id)          as can_open_admin,
       public.has_role(u.id, 'admin') as is_super_admin
  from auth.users u
  left join public.user_roles r     on r.user_id = u.id
  left join public.admin_profiles ap on ap.id    = u.id
 where lower(u.email) = 'you@example.com';
```

You want `role = admin`, `is_active = true`, and both checks `true`. Then sign in at
`/admin/login` — every tab should be there. If the panel says *"This account does not
have admin access"*, the `user_roles` row is missing or holds `customer`.

#### C8.5 Lock it in

- Set your own password: sign in → **Admin → Settings → Security** (asks for the
  current password, so the temporary one from C8.1 gets replaced). Or
  `/admin/login` → **Forgot password?** — that needs SMTP, or
  **Authentication → Users → ⋯ → Send reset password** in the dashboard.
- Don't reuse a password you've typed into a chat window anywhere.
- Optional hardening: in **Authentication → Providers → Email**, turn on leaked
  password protection and require the current password for password changes.
- Add a second admin before you ever demote or delete the first — the app refuses to
  remove the last admin, and with no admin left there is no in-app way back in.

#### C8.6 More team members later

Now that an admin exists, use **Admin → Team → Invite** (writes the `admin_profiles`
row and grants `staff`), or repeat C8.3 with `'staff'` instead of `'admin'` and then
tick the permissions you want in **Admin → Team → Permissions**, or apply a saved
preset. Staff see only the tabs you grant; admins see everything.

#### If something goes wrong

| What you see | Why | Fix |
| ------------ | --- | --- |
| "This account does not have admin access" | no `user_roles` row for that id, or it says `customer` | run C8.3 step 2 |
| "This admin email has not been confirmed yet" | Auto confirm was left off and the confirmation email never arrived | set up SMTP (C7), or re-add the user with Auto confirm ticked |
| Sign-up fails with "Unsupported provider" | Email provider is off | Authentication → Providers → Email → enable |
| `admin_profiles` insert fails on a foreign key | used `gen_random_uuid()` after the account existed | use `select id from auth.users where lower(email) = ...` |
| Two rows for the same email in `admin_profiles` | pre-registered with a throwaway id, then signed up | `delete from public.admin_profiles where id not in (select id from auth.users);` |
| You show up under Admin → Customers | signed up before being registered, so a `profiles` row was created | run C8.3 step 3 |
| "cannot remove the last admin" | you are the only admin | create a second admin first |


### C9. Move existing data (optional)

The Lovable Cloud database can't be reached with `pg_dump`, so move data through
the SQL editor or the admin import tools:

1. In the current project's SQL editor, run `select * from public.products;` and
   **Download results → CSV**. Repeat for: `categories`, `car_brands`,
   `car_models`, `battery_brands`, `product_images`, `product_fitment`, `offers`,
   `blog_posts`, `catalog_files`, `media_files`, `gst_rates`, `site_settings`,
   `orders`, `order_items`.
2. In the new project, import each CSV (**Table Editor → Import data**), or push
   product and fitment sheets through Admin → Products → bulk import.
3. Upload the image files into the new buckets, then rewrite any stored URLs that
   still point at the old host:
   ```sql
   update public.product_images
      set url = replace(url, 'https://<old-ref>.supabase.co',
                             'https://<new-ref>.supabase.co')
    where url like '%<old-ref>.supabase.co%';
   ```
4. Re-enter Admin → Settings → Email/SMTP by hand — the SMTP password is stored
   separately and should be typed again, not copied.

Customer logins cannot be exported with their passwords. Customers either reset
their password on the new site or sign up again.

### C10. Smoke test

- [ ] `/` loads, images show, search returns results
- [ ] Shop filters and pagination work, brand counts look right
- [ ] Add to cart → `/checkout` → GST per line item → order appears in Admin → Orders
- [ ] Sign up and confirm email → `/account` opens; phone verification works after an SMS provider is configured (C7)
- [ ] `/admin/login` as superadmin sees every tab; a staff account sees only what you granted
- [ ] Review with photo upload; return request with photo upload
- [ ] Admin → Settings → Email/SMTP → send test email succeeds

### C11. Ongoing

- **Backups**: Project Settings → Backups (daily on paid plans). Take a manual
  backup before every schema change.
- **Schema changes**: don't edit tables in the dashboard on production — write a
  new file in `supabase/migrations/` and run `supabase db push`.
- **Costs**: watch storage egress and monthly active users under
  Project Settings → Usage.
- **Keys**: rotate the publishable and secret keys from Project Settings → API
  Keys if anything leaks. The secret key must never appear in the browser bundle.
