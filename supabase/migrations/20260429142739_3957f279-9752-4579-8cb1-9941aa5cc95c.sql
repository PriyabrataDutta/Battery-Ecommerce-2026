
-- 1. Add phone verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- 2. Unique index on phone (case-insensitive, only when phone is set)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
  ON public.profiles (lower(phone))
  WHERE phone IS NOT NULL AND phone <> '';

-- 3. Phone verification codes table
CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pvc_self_all"
  ON public.phone_verification_codes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "pvc_staff_read"
  ON public.phone_verification_codes
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- 4. Update handle_new_user to capture phone from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If this email is pre-registered as an admin, link admin profile only
  IF EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE lower(email) = lower(NEW.email)
  ) THEN
    UPDATE public.admin_profiles
    SET id = NEW.id,
        full_name = COALESCE(full_name, NEW.raw_user_meta_data->>'full_name'),
        phone = COALESCE(phone, NEW.raw_user_meta_data->>'phone')
    WHERE lower(email) = lower(NEW.email);
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END $function$;

-- Make sure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Lookup email by phone (used by login form)
CREATE OR REPLACE FUNCTION public.lookup_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(p.phone) = lower(_phone)
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.lookup_email_by_phone(text) TO anon, authenticated;

-- 6. Verify phone code RPC
CREATE OR REPLACE FUNCTION public.verify_phone_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _row public.phone_verification_codes%ROWTYPE;
  _hash text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO _row FROM public.phone_verification_codes WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no code requested';
  END IF;

  IF _row.expires_at < now() THEN
    DELETE FROM public.phone_verification_codes WHERE user_id = auth.uid();
    RAISE EXCEPTION 'code expired';
  END IF;

  IF _row.attempts >= 5 THEN
    RAISE EXCEPTION 'too many attempts';
  END IF;

  _hash := encode(extensions.digest(_code, 'sha256'), 'hex');

  IF _hash <> _row.code_hash THEN
    UPDATE public.phone_verification_codes
       SET attempts = attempts + 1
     WHERE user_id = auth.uid();
    RETURN false;
  END IF;

  UPDATE public.profiles
     SET phone_verified = true,
         phone_verified_at = now()
   WHERE id = auth.uid();

  DELETE FROM public.phone_verification_codes WHERE user_id = auth.uid();
  RETURN true;
END $function$;

GRANT EXECUTE ON FUNCTION public.verify_phone_code(text) TO authenticated;

-- Make sure pgcrypto/digest is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
