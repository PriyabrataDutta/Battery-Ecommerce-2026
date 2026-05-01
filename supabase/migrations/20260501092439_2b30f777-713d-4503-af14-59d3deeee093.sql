ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_with_exchange numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_without_exchange numeric NOT NULL DEFAULT 0;