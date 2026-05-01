# Developer guide

Welcome. This guide is written for someone who has **never opened this
project before**. If you read it top-to-bottom you should be able to find
your way around, add a feature, and not break anything.

The app is an e-commerce storefront for car batteries. React + Vite +
TypeScript on the frontend. Lovable Cloud (a managed Supabase backend) for
data, auth, and file storage.

## Read these in order

1. [Architecture](./01-architecture.md) — the four layers and how data flows
2. [Folder tour](./02-folder-tour.md) — what lives where
3. [Adding a page](./03-adding-a-page.md) — recipe
4. [Adding a database table](./04-adding-a-table.md) — recipe
5. [Forms & validation](./05-forms-and-validation.md) — react-hook-form + zod
6. [Auth & roles](./06-auth-and-roles.md) — sign-in, phone gate, admin gate
7. [State management](./07-state-management.md) — server vs. client vs. URL
8. [Styling](./08-styling.md) — Tailwind tokens and the `ui/` library
9. [Common tasks](./09-common-tasks.md) — cookbook
10. [Troubleshooting](./10-troubleshooting.md) — when something explodes

## The one rule

> **No component or page imports `@/integrations/supabase/client` directly.**
> All backend calls go through `src/api/*` and (for reads/mutations in
> components) through `src/hooks/queries/*`.

If you ever feel tempted to call `supabase.from(...)` inside a `.tsx` file,
stop. Add the call to the matching `src/api/<domain>.ts` file instead and
import the function (or its React Query hook) from there.

That single rule is what keeps this project replaceable, testable, and sane.
