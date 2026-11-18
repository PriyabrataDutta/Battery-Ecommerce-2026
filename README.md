# Battery E-commerce 2026

E-commerce storefront for car batteries (Kachi Battery). Customers search batteries by car brand/model fitment, browse by brand and category, request quotes, and check out. Admins manage products, fitment, orders, blog posts, and site settings.

## Tech stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui (Radix)
- **Data:** TanStack React Query, react-hook-form + zod
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Migrations:** SQL in `supabase/migrations`, Drizzle schema in `drizzle/`
- **Tests:** Vitest

## Getting started

```bash
git clone https://github.com/PriyabrataDutta/Battery-Ecommerce-2026.git
cd Battery-Ecommerce-2026
npm install
cp .env.example .env   # fill in your Supabase project values
npm run dev
```

Requires Node 18+. The `predev`/`prebuild` hooks generate `public/sitemap.xml` (uses `bunx tsx`).

### Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key — safe for the browser |

Never put the service-role / secret key in `.env`; it belongs only in Edge Function secrets.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run Vitest once |

## Project structure

```text
src/
  pages/            route entry points (shop, cart, checkout, account, admin…)
  components/       shared + feature components, ui/ = shadcn library
  hooks/queries/    React Query hooks wrapping src/api
  api/              the only layer that talks to Supabase
  integrations/     Supabase client + generated types
  stores/ lib/ types/
supabase/
  migrations/       database schema (SQL)
  functions/        Edge Functions (bulk imports, phone verification, email…)
  config.toml
drizzle/            Drizzle schema + migrations
docs/               developer guide
scripts/            sitemap generator
```

**The one rule:** components and pages never import the Supabase client directly — all backend calls go through `src/api/*` and `src/hooks/queries/*`.

## Backend setup

```bash
supabase link --project-ref <your-ref>
supabase db push                 # apply migrations
supabase functions deploy        # deploy Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # plus any provider keys
```

## Documentation

See [`docs/`](./docs/README.md) for architecture, folder tour, recipes (adding pages/tables), auth & roles, styling, troubleshooting, and [deployment](./docs/DEPLOYMENT.md).
