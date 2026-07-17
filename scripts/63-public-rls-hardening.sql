-- =============================================================================
-- 63 — Durcissement RLS (public schema)
-- Corrige l'alerte Supabase : rls_disabled_in_public
-- Idempotent — peut être relancé sans erreur.
--
-- Stratégie :
--   • service_role (API Next.js) bypass la RLS → aucun impact sur les routes /api/*
--   • Menu / catalogue : lecture publique (SELECT), écriture staff uniquement
--   • Données sensibles (commandes, caisse, staff…) : staff/admin uniquement
--   • Données utilisateur : propriétaire + staff
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Helper staff (réutilise la définition de 08-advanced.sql)
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
-- 2. Activer RLS sur toutes les tables public.* qui ne l'ont pas encore
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    RAISE NOTICE 'RLS activée sur public.%', r.tbl;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Policies — menu / catalogue (lecture publique, écriture staff)
-- -----------------------------------------------------------------------------
DO $pol$
DECLARE
  t text;
  menu_tables text[] := ARRAY[
    'categories',
    'products',
    'product_modifier_groups',
    'product_modifiers',
    'product_variant_groups',
    'product_variants',
    'product_recommendations',
    'menu_homepage_sections'
  ];
BEGIN
  FOREACH t IN ARRAY menu_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_public_read ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_public_read ON %I FOR SELECT USING (true)',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_staff_write ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_staff_write ON %I FOR INSERT WITH CHECK (is_staff_or_admin())',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_staff_update ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_staff_update ON %I FOR UPDATE USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin())',
      t, t
    );
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_staff_delete ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_staff_delete ON %I FOR DELETE USING (is_staff_or_admin())',
      t, t
    );
  END LOOP;
END $pol$;

-- station_availability : statut visible côté menu, modification staff
DO $pol$
BEGIN
  IF to_regclass('public.station_availability') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_station_availability_public_read ON station_availability;
    CREATE POLICY jb_station_availability_public_read
      ON station_availability FOR SELECT USING (true);
    DROP POLICY IF EXISTS jb_station_availability_staff_write ON station_availability;
    CREATE POLICY jb_station_availability_staff_write
      ON station_availability FOR ALL
      USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
  END IF;
END $pol$;

-- events : lecture publique des événements ouverts
DO $pol$
BEGIN
  IF to_regclass('public.events') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_events_public_read ON events;
    CREATE POLICY jb_events_public_read
      ON events FOR SELECT
      USING (is_available = true OR is_staff_or_admin());
    DROP POLICY IF EXISTS jb_events_staff_write ON events;
    CREATE POLICY jb_events_staff_write
      ON events FOR ALL
      USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
  END IF;
END $pol$;

-- promotional_offers : offres actives lisibles
DO $pol$
BEGIN
  IF to_regclass('public.promotional_offers') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_promotional_offers_public_read ON promotional_offers;
    CREATE POLICY jb_promotional_offers_public_read
      ON promotional_offers FOR SELECT
      USING (active = true OR is_staff_or_admin());
    DROP POLICY IF EXISTS jb_promotional_offers_staff_write ON promotional_offers;
    CREATE POLICY jb_promotional_offers_staff_write
      ON promotional_offers FOR ALL
      USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
  END IF;
END $pol$;

-- -----------------------------------------------------------------------------
-- 4. Policies — staff uniquement (opérations internes)
-- -----------------------------------------------------------------------------
DO $pol$
DECLARE
  t text;
  staff_tables text[] := ARRAY[
    'orders',
    'order_items',
    'restaurant_tables',
    'table_sessions',
    'table_session_merges',
    'table_session_transfers',
    'guest_sessions',
    'staff',
    'staff_profiles',
    'purchases',
    'ingredients',
    'stock_movements',
    'product_ingredients',
    'reorder_requests',
    'promotions',
    'coupons',
    'reservation_reminders',
    'loyalty_rewards',
    'drivers',
    'delivery_trackings',
    'event_packages',
    'event_assignments',
    'expense_categories',
    'budgets',
    'model_registry',
    'model_versions',
    'ab_tests',
    'ab_test_variants',
    'ab_test_results',
    'daily_metrics',
    'event_waitlist',
    'event_notification_log',
    'finance_tax_settings',
    'employee_advances',
    'cash_day_closings',
    'caisse_intelligence_alerts',
    'cash_register_movements',
    'external_cash_incomes',
    'station_availability_log',
    'order_item_refusals',
    'purchase_recommendation_log',
    'purchase_notification_seen',
    'invoice_offer_redemptions',
    'user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY staff_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS jb_%s_staff_all ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY jb_%s_staff_all ON %I FOR ALL USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin())',
      t, t
    );
  END LOOP;
END $pol$;

-- invoice_items / payments : RLS déjà activée en 06 mais sans policies explicites
DO $pol$
BEGIN
  IF to_regclass('public.invoice_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_invoice_items_staff_all ON invoice_items;
    CREATE POLICY jb_invoice_items_staff_all
      ON invoice_items FOR ALL
      USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
  END IF;
  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_payments_staff_all ON payments;
    CREATE POLICY jb_payments_staff_all
      ON payments FOR ALL
      USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
  END IF;
END $pol$;

-- -----------------------------------------------------------------------------
-- 5. Policies — données utilisateur (propriétaire + staff)
-- -----------------------------------------------------------------------------
DO $pol$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_users_self_read ON users;
    CREATE POLICY jb_users_self_read
      ON users FOR SELECT
      USING (id = auth.uid() OR is_staff_or_admin());
    DROP POLICY IF EXISTS jb_users_self_update ON users;
    CREATE POLICY jb_users_self_update
      ON users FOR UPDATE
      USING (id = auth.uid() OR is_staff_or_admin())
      WITH CHECK (id = auth.uid() OR is_staff_or_admin());
    DROP POLICY IF EXISTS jb_users_staff_insert ON users;
    CREATE POLICY jb_users_staff_insert
      ON users FOR INSERT
      WITH CHECK (is_staff_or_admin() OR id = auth.uid());
  END IF;

  IF to_regclass('public.event_reservations') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_event_reservations_self ON event_reservations;
    CREATE POLICY jb_event_reservations_self
      ON event_reservations FOR ALL
      USING (user_id = auth.uid() OR is_staff_or_admin())
      WITH CHECK (user_id = auth.uid() OR is_staff_or_admin());
  END IF;

  IF to_regclass('public.table_reservations') IS NOT NULL THEN
    DROP POLICY IF EXISTS jb_table_reservations_self ON table_reservations;
    CREATE POLICY jb_table_reservations_self
      ON table_reservations FOR ALL
      USING (user_id = auth.uid() OR is_staff_or_admin())
      WITH CHECK (user_id IS NULL OR user_id = auth.uid() OR is_staff_or_admin());
  END IF;
END $pol$;

COMMIT;

-- Vérification (doit retourner 0 ligne idéalement)
SELECT c.relname AS table_sans_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
ORDER BY 1;
