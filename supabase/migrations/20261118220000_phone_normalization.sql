-- Sign-up / phone fixes (2026-11-18):
--  * One phone format everywhere: +91 followed by a 10-digit Indian mobile.
--  * Sign-up never fails because a phone is already used (account is created
--    without a phone; the customer is asked for one on /add-phone).
--  * Phone login matches however the number is typed.
--  * Changing the phone clears phone_verified.
--  * Existing phones cleaned (Lovable import left a leading tab).

-- '+91 98765-43210', '919876543210', '09876543210', '9876543210' → '+919876543210'.
-- Anything that isn't a 10-digit Indian mobile → NULL.
CREATE OR REPLACE FUNCTION public.normalize_in_phone(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN d ~ '^[6-9][0-9]{9}$' THEN '+91' || d END
    FROM (SELECT CASE
                   WHEN length(x) = 12 AND x LIKE '91%' THEN substr(x, 3)
                   WHEN length(x) = 11 AND x LIKE '0%' THEN substr(x, 2)
                   ELSE x
                 END AS d
            FROM (SELECT regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') AS x) s) t
$$;

-- Clean existing data before the trigger exists (so cleaning keeps them verified).
UPDATE public.profiles
   SET phone = public.normalize_in_phone(phone),
       phone_verified = CASE WHEN public.normalize_in_phone(phone) IS NULL THEN false ELSE phone_verified END,
       phone_verified_at = CASE WHEN public.normalize_in_phone(phone) IS NULL THEN NULL ELSE phone_verified_at END
 WHERE phone IS NOT NULL AND phone IS DISTINCT FROM public.normalize_in_phone(phone);

-- Every write to profiles.phone is normalized; a changed number must be re-verified.
CREATE OR REPLACE FUNCTION public.tg_profiles_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND btrim(NEW.phone) <> '' THEN
    NEW.phone := public.normalize_in_phone(NEW.phone);
    IF NEW.phone IS NULL THEN
      RAISE EXCEPTION 'Enter a valid 10-digit Indian mobile number' USING ERRCODE = '22023';
    END IF;
  ELSE
    NEW.phone := NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.phone IS DISTINCT FROM OLD.phone THEN
    NEW.phone_verified := false;
    NEW.phone_verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_profiles_phone ON public.profiles;
CREATE TRIGGER trg_profiles_phone
  BEFORE INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_profiles_phone();

-- Sign-up: invalid or already-used phone → create the account without a phone.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_phone text := public.normalize_in_phone(NEW.raw_user_meta_data->>'phone');
BEGIN
  -- If this email is pre-registered as an admin, link admin profile only
  IF EXISTS (SELECT 1 FROM public.admin_profiles WHERE lower(email) = lower(NEW.email)) THEN
    UPDATE public.admin_profiles
       SET id = NEW.id,
           full_name = COALESCE(full_name, NEW.raw_user_meta_data->>'full_name'),
           phone = COALESCE(phone, v_phone)
     WHERE lower(email) = lower(NEW.email);
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
    END IF;
    RETURN NEW;
  END IF;

  IF v_phone IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_phone) THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', v_phone);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

-- Phone login: match the normalized number however it was typed.
CREATE OR REPLACE FUNCTION public.lookup_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
   WHERE p.phone = public.normalize_in_phone(_phone)
   LIMIT 1;
$$;
