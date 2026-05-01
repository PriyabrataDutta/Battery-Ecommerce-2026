# Adding a database table

Worked example: a `reviews` table where users leave product reviews.

## 1. Create the migration

Use the Lovable migration tool (in chat, ask the AI to apply a migration).
Never run raw `psql ALTER` in the codebase.

```sql
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "anyone can read"
  on public.reviews for select
  using (true);

create policy "users can insert their own"
  on public.reviews for insert to authenticated
  with check (user_id = auth.uid());

create policy "users can update their own"
  on public.reviews for update to authenticated
  using (user_id = auth.uid());
```

**RLS is mandatory** on every new table. If reads should be public, add a
`using (true)` SELECT policy. If they're per-user, gate by `auth.uid()`.

## 2. Types regenerate automatically

`src/integrations/supabase/types.ts` is rewritten by Lovable after the
migration. You'll see `reviews` show up in the `Database["public"]["Tables"]`
union. Don't edit that file.

## 3. Add an api file

```ts
// src/api/reviews.ts
import { supabase } from "./client";

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

export async function listReviewsForProduct(productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function createReview(input: Omit<Review, "id" | "created_at">) {
  const { error } = await supabase.from("reviews").insert(input);
  if (error) throw error;
}
```

## 4. Add hooks

```ts
// src/hooks/queries/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listReviewsForProduct, createReview } from "@/api/reviews";
import { qk } from "./keys";

export function useReviewsForProduct(productId?: string) {
  return useQuery({
    queryKey: qk.reviews.forProduct(productId),
    queryFn: () => listReviewsForProduct(productId!),
    enabled: Boolean(productId),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.reviews.forProduct(vars.product_id) });
    },
  });
}
```

Add the key:

```ts
// src/hooks/queries/keys.ts
reviews: {
  all: ["reviews"] as const,
  forProduct: (id?: string) => ["reviews", "forProduct", id] as const,
},
```

## 5. Use it in the UI

```tsx
const { data: reviews } = useReviewsForProduct(product.id);
const createReview = useCreateReview();

<Button onClick={() => createReview.mutate({ ... })}>Submit</Button>
```

That's it — five small files, all in predictable places.
