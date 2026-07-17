-- =============================================================================
-- 64 — Verrouillage données sensibles (PII)
-- Corrige l'alerte Supabase : sensitive_columns_exposed
-- À exécuter APRÈS 63-public-rls-hardening.sql (ou seul si 63 pas encore appliqué)
-- Idempotent.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Helper staff (au cas où 63 n'a pas encore tourné)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_staff_or_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users u
    LEFT JOIN user_roles r ON r.id = u.role_id
    WHERE u.id = auth.uid()
      AND (
        r.auth_level IN ('STAFF', 'ADMIN')
        OR u.role IN ('admin', 'manager', 'serveur', 'cuisinier', 'caissier', 'livreur')
      )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 2. Tables PII — activer + forcer RLS + refuser anon explicitement
-- -----------------------------------------------------------------------------
DO $pii$
DECLARE
  t text;
  pii_tables text[] := ARRAY[
    'users',
    'profiles',
    'orders',
    'invoices',
    'payments',
    'event_reservations',
    'table_reservations',
    'event_requests',
    'event_waitlist',
    'event_tickets',
    'suppliers',
    'ingredients',
    'audit_logs',
    'drivers',
    'delivery_trackings',
    'staff',
    'client_credit_payments',
    'client_credit_reminders',
    'client_credit_limits',
    'client_memory',
    'chat_sessions'
  ];
BEGIN
  FOREACH t IN ARRAY pii_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);

    -- Bloquer totalement le rôle anon (même si une policy serait trop permissive)
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_deny_anon ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_deny_anon ON %I AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;
END $pii$;

-- -----------------------------------------------------------------------------
-- 3. Policies fines — users & profiles (données personnelles)
-- -----------------------------------------------------------------------------
DO $users$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_users_self_read ON users;
    CREATE POLICY jb_users_self_read
      ON users FOR SELECT TO authenticated
      USING (id = auth.uid() OR is_staff_or_admin());

    DROP POLICY IF EXISTS jb_users_self_update ON users;
    CREATE POLICY jb_users_self_update
      ON users FOR UPDATE TO authenticated
      USING (id = auth.uid() OR is_staff_or_admin())
      WITH CHECK (id = auth.uid() OR is_staff_or_admin());

    DROP POLICY IF EXISTS jb_users_staff_insert ON users;
    CREATE POLICY jb_users_staff_insert
      ON users FOR INSERT TO authenticated
      WITH CHECK (is_staff_or_admin() OR id = auth.uid());

    DROP POLICY IF EXISTS jb_users_staff_delete ON users;
    CREATE POLICY jb_users_staff_delete
      ON users FOR DELETE TO authenticated
      USING (is_staff_or_admin());
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_profiles_deny_anon_select ON profiles;
    CREATE POLICY jb_profiles_deny_anon_select
      ON profiles AS RESTRICTIVE FOR ALL TO anon
      USING (false) WITH CHECK (false);

    DROP POLICY IF EXISTS jb_profiles_select_own ON profiles;
    CREATE POLICY jb_profiles_select_own
      ON profiles FOR SELECT TO authenticated
      USING (auth.uid() = id OR is_staff_or_admin());

    DROP POLICY IF EXISTS jb_profiles_update_own ON profiles;
    CREATE POLICY jb_profiles_update_own
      ON profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id OR is_staff_or_admin())
      WITH CHECK (auth.uid() = id OR is_staff_or_admin());
  END IF;
END $users$;

-- -----------------------------------------------------------------------------
-- 4. Vues exposant email/téléphone — security_invoker + pas d'accès anon
-- -----------------------------------------------------------------------------
DO $views$
DECLARE
  v text;
  sensitive_views text[] := ARRAY[
    'v_users_with_role',
    'v_client_credit_summary',
    'v_active_deliveries',
    'v_driver_stats',
    'v_pending_event_requests'
  ];
BEGIN
  FOREACH v IN ARRAY sensitive_views LOOP
    IF to_regclass('public.' || v) IS NULL THEN
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'security_invoker non appliqué sur % : %', v, SQLERRM;
    END;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', v);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', v);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v);
    EXECUTE format('GRANT SELECT ON public.%I TO service_role', v);
  END LOOP;
END $views$;

-- -----------------------------------------------------------------------------
-- 5. Révoquer l'accès direct anon aux tables PII (couche supplémentaire)
-- -----------------------------------------------------------------------------
DO $revoke$
DECLARE
  t text;
  pii_tables text[] := ARRAY[
    'users', 'profiles', 'orders', 'invoices', 'payments',
    'event_reservations', 'table_reservations', 'event_requests',
    'event_waitlist', 'event_tickets', 'suppliers', 'audit_logs',
    'drivers', 'delivery_trackings', 'staff', 'client_memory', 'chat_sessions'
  ];
BEGIN
  FOREACH t IN ARRAY pii_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $revoke$;

COMMIT;

-- Diagnostic : tables PII encore sans RLS (doit être vide)
SELECT c.relname AS table_pii_sans_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
  AND c.relname IN (
    'users', 'profiles', 'orders', 'invoices', 'payments',
    'event_reservations', 'table_reservations', 'event_requests',
    'event_waitlist', 'event_tickets', 'suppliers', 'audit_logs',
    'drivers', 'delivery_trackings'
  )
ORDER BY 1;
