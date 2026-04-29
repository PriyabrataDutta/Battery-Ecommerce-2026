-- 1. Create admin_profiles table (separate from customer profiles)
CREATE TABLE public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  title text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Staff can read all admin profiles; admins can manage them
CREATE POLICY "admin_profiles_staff_read"
ON public.admin_profiles FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "admin_profiles_self_update"
ON public.admin_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admin_profiles_admin_write"
ON public.admin_profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER admin_profiles_set_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Helper: is this email an admin account?
CREATE OR REPLACE FUNCTION public.is_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE lower(ap.email) = lower(_email)
      AND ap.is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_email(text) TO anon, authenticated;

-- 3. Update handle_new_user trigger so admin signups don't get a customer profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    -- ensure a staff/admin role exists (default to staff if none)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
    END IF;
    RETURN NEW;
  END IF;

  -- Otherwise: regular customer signup
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END $function$;

-- 4. Backfill: migrate existing staff users into admin_profiles
INSERT INTO public.admin_profiles (id, email, full_name, phone)
SELECT p.id, u.email, p.full_name, p.phone
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE public.is_staff(p.id)
ON CONFLICT (id) DO NOTHING;

-- Remove customer profile rows for those who are staff (logical separation)
DELETE FROM public.profiles
WHERE id IN (SELECT id FROM public.admin_profiles);

-- 5. Admin-only RPC to provision a new admin (creates admin_profiles row + role)
CREATE OR REPLACE FUNCTION public.admin_create_admin_profile(
  _email text,
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _role app_role DEFAULT 'staff'::app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_user_id uuid;
  _new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden: only admins can create admin profiles';
  END IF;

  IF _role NOT IN ('admin'::app_role, 'staff'::app_role) THEN
    RAISE EXCEPTION 'role must be admin or staff';
  END IF;

  SELECT id INTO _existing_user_id FROM auth.users WHERE lower(email) = lower(_email);

  INSERT INTO public.admin_profiles (id, email, full_name, phone)
  VALUES (COALESCE(_existing_user_id, gen_random_uuid()), _email, _full_name, _phone)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.admin_profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.admin_profiles.phone)
  RETURNING id INTO _new_id;

  IF _existing_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = _existing_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (_existing_user_id, _role);
    -- remove any leftover customer profile
    DELETE FROM public.profiles WHERE id = _existing_user_id;
  END IF;

  PERFORM public.admin_log('admin.invite', 'admin_profile', _new_id::text,
    jsonb_build_object('email', _email, 'role', _role::text));

  RETURN _new_id;
END $$;