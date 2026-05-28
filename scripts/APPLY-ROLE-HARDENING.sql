-- =============================================================================
-- APPLY-ROLE-HARDENING.sql
-- =============================================================================
-- Filet de securite DB :
--   - A l'inscription publique (INSERT dans auth.users), force role='CLIENT'
--     dans raw_user_meta_data si l'utilisateur essaie de s'auto-attribuer
--     un role interne (ADMIN / SERVER / KITCHEN / BAR / SHISHA / CASHIER / DELIVERY).
--   - Ne bloque pas les UPDATE (l'admin peut changer le role).
--   - Idempotent : peut etre relance.
-- =============================================================================

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
  -- API admin / service role (e-mail deja confirme a l'insertion) : garder le role demande.
  IF NEW.email_confirmed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_role := upper(coalesce(NEW.raw_user_meta_data ->> 'role', ''));

  -- Si le role tente d'etre un role interne, on le force a CLIENT.
  IF v_role IN ('ADMIN','SERVER','KITCHEN','BAR','SHISHA','CASHIER','DELIVERY') THEN
    NEW.raw_user_meta_data =
      coalesce(NEW.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role','CLIENT');
  ELSIF v_role = '' OR v_role = 'CUSTOMER' OR v_role = 'STAFF' THEN
    -- Normalise les valeurs legacy / absentes a CLIENT.
    NEW.raw_user_meta_data =
      coalesce(NEW.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('role','CLIENT');
  END IF;

  RETURN NEW;
END;
$$;

-- On applique uniquement au BEFORE INSERT (signup).
-- Les UPDATE (promotion admin) restent libres.
DROP TRIGGER IF EXISTS trg_enforce_client_role_on_signup ON auth.users;
CREATE TRIGGER trg_enforce_client_role_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_client_role_on_signup();

-- =============================================================================
-- Verification : doit retourner 1 ligne
-- =============================================================================
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trg_enforce_client_role_on_signup';
