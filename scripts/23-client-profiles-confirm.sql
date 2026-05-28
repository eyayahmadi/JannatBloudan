-- =============================================================================
-- Profils clients (public.profiles) — cree uniquement apres confirmation e-mail
-- -----------------------------------------------------------------------------
-- Optionnel — mode lien explicite avec jeton (template e-mail personnalise) :
--   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">
--   Sinon le flux par defaut Supabase redirige vers /auth/confirm avec ?code= ou #access_token
--
-- A executer dans Supabase SQL Editor (apres les migrations auth existantes).
-- Declencheur sur auth.users : quand email_confirmed_at passe de NULL a une date,
-- insertion / mise a jour de la ligne profiles (role CLIENT par defaut).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  first_name TEXT,
  last_name  TEXT,
  phone      TEXT,
  role       TEXT NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.handle_profile_after_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.email_confirmed_at IS NOT DISTINCT FROM NEW.email_confirmed_at THEN
      RETURN NEW;
    END IF;
  END IF;

  v_role := UPPER(COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'role'), ''), 'CLIENT'));
  IF v_role IN ('ADMIN', 'SERVER', 'KITCHEN', 'BAR', 'SHISHA', 'CASHIER', 'DELIVERY') THEN
    v_role := 'CLIENT';
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'last_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name  = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    phone      = COALESCE(EXCLUDED.phone, public.profiles.phone),
    role       = EXCLUDED.role,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_after_email_confirmed ON auth.users;
CREATE TRIGGER trg_profile_after_email_confirmed
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_after_email_confirmed();

COMMENT ON TABLE public.profiles IS 'Profil client — ligne creee lorsque email_confirmed_at est defini (Supabase Auth).';
