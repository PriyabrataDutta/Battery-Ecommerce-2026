-- 1. customer_addresses
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  line1 text NOT NULL,
  line2 text,
  landmark text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  gstin text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_addresses_user_idx ON public.customer_addresses(user_id);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_self_all"
  ON public.customer_addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses_staff_read"
  ON public.customer_addresses FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: keep only one default address per user.
CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
       SET is_default = false
     WHERE user_id = NEW.user_id
       AND id <> NEW.id
       AND is_default = true;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_address();

-- 2. wishlist_items
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX wishlist_items_user_idx ON public.wishlist_items(user_id);
CREATE INDEX wishlist_items_product_idx ON public.wishlist_items(product_id);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_self_all"
  ON public.wishlist_items FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlist_staff_read"
  ON public.wishlist_items FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 3. extend orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS promo_label text,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS delivery_method text,
  ADD COLUMN IF NOT EXISTS delivery_label text,
  ADD COLUMN IF NOT EXISTS scheduled_date date,
  ADD COLUMN IF NOT EXISTS scheduled_slot text,
  ADD COLUMN IF NOT EXISTS scheduled_slot_label text,
  ADD COLUMN IF NOT EXISTS scheduled_slot_window text,
  ADD COLUMN IF NOT EXISTS order_number text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_uidx
  ON public.orders(order_number)
  WHERE order_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

-- Ensure updated_at trigger exists on orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
  ) THEN
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;