-- Backfill price_without_exchange and price_with_exchange for products that have has_exchange=true but 0 values
UPDATE products
SET price_without_exchange = price,
    price_with_exchange = ROUND(price * 0.85)
WHERE has_exchange = true
  AND (price_with_exchange IS NULL OR price_with_exchange = 0 OR price_without_exchange IS NULL OR price_without_exchange = 0);

-- Also backfill products without exchange that have 0 values
UPDATE products
SET price_without_exchange = price
WHERE (price_without_exchange IS NULL OR price_without_exchange = 0);