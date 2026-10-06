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

```bash
npm install -g supabase
supabase login                      # browser sign-in to your new account
cd <project-folder>
supabase link --project-ref <new-ref>
```

Then make `supabase/config.toml` match the new project:

```toml
project_id = "<new-ref>"

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

### C4. Push the schema

```bash
supabase db push        # applies all 29 files in supabase/migrations, in order
```

This creates every table, enum, RLS policy, trigger and database function exactly
as the app expects. Confirm nothing was skipped:

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

Migrations already create **media** (public), **review-images** (public) and
**return-images** (private). Create the remaining five — **Storage → New bucket**
in the dashboard, or run this in the SQL editor:

```sql
insert into storage.buckets (id, name, public) values
  ('blog',           'blog',           true),
  ('brand-logos',    'brand-logos',    true),
  ('catalogs',       'catalogs',       true),
  ('product-images', 'product-images', true),
  ('quote-uploads',  'quote-uploads',  false)
on conflict (id) do nothing;
```

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
3. **SMTP** for reset-password and confirmation emails: either Authentication →
   SMTP in the dashboard, or Admin → Settings → Email/SMTP in the app, which
   writes `smtp_config` and `smtp_password` into `site_settings` for the
   `send-test-email` function to read. Either way you need real SMTP credentials
   (Gmail app password, Resend, SES, etc.).
4. **Phone verification**: codes are hashed into `phone_verification_codes` and
   checked by `verify_phone_code`, but `send-phone-verification-code` has no SMS
   provider wired in yet — add your provider there before launch.
5. **Google sign-in** is not wired up. If you want it, add the Google provider in
   the dashboard and a `signInWithOAuth` call in `src/pages/Auth.tsx`.

### C8. Create the superadmin

1. **Authentication → Users → Add user** → your email + a strong password, tick
   **Auto confirm**. (Or sign up at `/admin/login` and confirm by email.)
2. **SQL Editor** → register and promote:
   ```sql
   insert into public.admin_profiles (id, email, full_name, is_active)
   select id, 'you@example.com', 'Priyabrata Dutta', true
     from auth.users where lower(email) = 'you@example.com'
   on conflict (id) do update set is_active = true;

   delete from public.user_roles
    where user_id = (select id from auth.users where lower(email) = 'you@example.com');
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where lower(email) = 'you@example.com';
   ```
3. Verify:
   ```sql
   select u.email, r.role from auth.users u
     join public.user_roles r on r.user_id = u.id
    where r.role = 'admin';
   ```
4. Sign in at `/admin/login`, then set your real password in
   **Admin → Settings → Security**.

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
- [ ] Sign up → phone code arrives → `/account` opens
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
