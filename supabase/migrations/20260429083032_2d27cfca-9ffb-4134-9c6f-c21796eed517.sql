
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_exchange boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exchange_rebate numeric NOT NULL DEFAULT 0;

UPDATE public.products
SET exchange_rebate = GREATEST(0, ROUND((price * 0.10) / 5) * 5)
WHERE exchange_rebate = 0 AND price > 0;
