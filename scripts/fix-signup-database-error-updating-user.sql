-- =============================================================================
-- Fix : erreurs Supabase Auth « Database error creating/updating user »
-- -----------------------------------------------------------------------------
-- Causes fréquentes (migrations 06 + 08 + 23 + APPLY-ROLE-HARDENING) :
--   1) INSERT dans audit_logs depuis log_audit_event() alors que RLS sur
--      audit_logs n’a souvent qu’une politique FOR SELECT → échec silencieux
--      en chaîne sur la transaction auth (même avec SECURITY DEFINER selon
--      propriétaire / FORCE ROW LEVEL SECURITY).
--   2) INSERT dans public.profiles (trigger e-mail confirmé) sous RLS sans
--      politique INSERT pour les rôles JWT.
--   3) INSERT/UPDATE dans public.users (sync auth) si RLS ou policies
--      indirectes bloquent.
--   4) Trigger enforce_client_role_on_signup : à l’insertion avec e-mail déjà
--      confirmé (API admin, seed), il forçait CLIENT pour tous les rôles ;
--      ce n’est pas la cause directe de l’erreur DB, mais cassait les comptes
--      staff créés par la service role — corrigé ci-dessous.
--
-- Correction : SECURITY DEFINER + SET row_security = off sur ces fonctions
-- (recommandé par Postgres pour triggers qui écrivent sous RLS).
--
-- Idempotent — Supabase → SQL Editor → Run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Audit → audit_logs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id UUID;
  v_old JSONB;
  v_new JSONB;
  v_action VARCHAR(20);
BEGIN
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_old    := to_jsonb(OLD);
    v_new    := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_old    := to_jsonb(OLD);
    v_new    := to_jsonb(NEW);
  ELSE
    v_action := 'create';
    v_old    := NULL;
    v_new    := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    COALESCE(
      (v_new->>'id')::TEXT,
      (v_old->>'id')::TEXT
    ),
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.log_audit_event() IS
  'Audit trigger — SECURITY DEFINER, row_security off pour INSERT sous RLS (signup / sync users).';

-- -----------------------------------------------------------------------------
-- 2) Sync auth.users → public.users (migration 06)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    UPDATE public.users
    SET email     = NEW.email,
        full_name = COALESCE(
          NEW.raw_user_meta_data ->> 'full_name',
          NULLIF(CONCAT_WS(' ',
            NEW.raw_user_meta_data ->> 'first_name',
            NEW.raw_user_meta_data ->> 'last_name'
          ), ''),
          public.users.full_name
        ),
        phone = COALESCE(NEW.raw_user_meta_data ->> 'phone', public.users.phone),
        role  = COALESCE(NEW.raw_user_meta_data ->> 'role', public.users.role)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, full_name, phone, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NULLIF(CONCAT_WS(' ',
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
      ), ''),
      NEW.email
    ),
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'CUSTOMER'),
    NEW.created_at
  );
  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_auth_user_to_public() IS
  'Sync auth → public.users — row_security off pour éviter blocages RLS.';

-- -----------------------------------------------------------------------------
-- 3) Profil client après confirmation e-mail (scripts/23-client-profiles-confirm.sql)
-- -----------------------------------------------------------------------------
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

COMMENT ON FUNCTION public.handle_profile_after_email_confirmed() IS
  'Profil après confirmation — row_security off pour INSERT/UPSERT sous RLS.';

-- -----------------------------------------------------------------------------
-- 4) Durcissement rôle : ne pas écraser le rôle si l’e-mail est déjà confirmé
--    à l’INSERT (création via service role / admin API / seed-test-accounts).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_client_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_role := upper(coalesce(NEW.raw_user_meta_data ->> 'role', ''));

  IF v_role IN ('ADMIN','SERVER','KITCHEN','BAR','SHISHA','CASHIER','DELIVERY') THEN
    NEW.raw_user_meta_data =
      coalesce(NEW.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role','CLIENT');
  ELSIF v_role = '' OR v_role = 'CUSTOMER' OR v_role = 'STAFF' THEN
    NEW.raw_user_meta_data =
      coalesce(NEW.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role','CLIENT');
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Si ça échoue encore : Dashboard → Logs → Postgres (filtrer « ERROR ») pendant
-- un signup, ou désactiver temporairement audit_users_trg pour isoler la cause.
-- =============================================================================
