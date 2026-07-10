-- =============================================================================
-- Migration 33 — Ajout Terrasse T41 + Nofra N15 (66 tables au total)
-- À exécuter si la migration 32 (64 tables) est déjà en production.
-- Idempotent — n'altère pas les ids 1–64 existants.
-- =============================================================================

BEGIN;

INSERT INTO restaurant_tables (
  id, table_number, table_code, display_name, zone, plan_zone,
  capacity, status, is_active, position_x, position_y
)
VALUES
  (65, 65, 'T41', 'Terrasse T41', 'terrasse', 'terrasse', 6, 'FREE', true, 0, 5),
  (66, 66, 'N15', 'Nofra N15', 'nofra', 'nofra', 6, 'FREE', true, 3, 3)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  table_code = EXCLUDED.table_code,
  display_name = EXCLUDED.display_name,
  zone = EXCLUDED.zone,
  plan_zone = EXCLUDED.plan_zone,
  capacity = EXCLUDED.capacity,
  status = CASE
    WHEN restaurant_tables.current_session_id IS NOT NULL THEN restaurant_tables.status
    ELSE 'FREE'
  END,
  is_active = EXCLUDED.is_active,
  position_x = EXCLUDED.position_x,
  position_y = EXCLUDED.position_y,
  updated_at = NOW();

COMMIT;

COMMENT ON TABLE restaurant_tables IS 'Plan Jannat Bloudan : 66 tables (terrasse/nofra/central). QR → /table/{code}/menu';
