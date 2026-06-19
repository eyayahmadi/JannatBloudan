-- =============================================================================
-- Migration 32 — Plan réel Jannat Bloudan (64 tables)
-- Terrasse T01–T40 | Nofra N01–N14 | Central C01–C10
-- QR : https://jannat-bloudan.vercel.app/table/{code}/menu
-- Idempotent. Exécuter après 24-restaurant-tables-qr-admin.sql
-- =============================================================================

BEGIN;

-- Désactiver les anciennes tables de test (codes t1, t2, … ou hors plan 64)
UPDATE restaurant_tables
SET is_active = false,
    status = 'CLEANING',
    updated_at = NOW()
WHERE table_code ~ '^t[0-9]+$'
   OR id > 64
   OR table_code NOT IN ('T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21', 'T22', 'T23', 'T24', 'T25', 'T26', 'T27', 'T28', 'T29', 'T30', 'T31', 'T32', 'T33', 'T34', 'T35', 'T36', 'T37', 'T38', 'T39', 'T40', 'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09', 'N10', 'N11', 'N12', 'N13', 'N14', 'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10');

-- Upsert des 64 tables réelles
INSERT INTO restaurant_tables (
  id, table_number, table_code, display_name, zone, plan_zone,
  capacity, status, is_active, position_x, position_y
)
VALUES
  (1, 1, 'T01', 'Terrasse T01', 'terrasse', 'terrasse', 2, 'FREE', true, 0, 0),
  (2, 2, 'T02', 'Terrasse T02', 'terrasse', 'terrasse', 2, 'FREE', true, 1, 0),
  (3, 3, 'T03', 'Terrasse T03', 'terrasse', 'terrasse', 2, 'FREE', true, 2, 0),
  (4, 4, 'T04', 'Terrasse T04', 'terrasse', 'terrasse', 2, 'FREE', true, 3, 0),
  (5, 5, 'T05', 'Terrasse T05', 'terrasse', 'terrasse', 2, 'FREE', true, 4, 0),
  (6, 6, 'T06', 'Terrasse T06', 'terrasse', 'terrasse', 2, 'FREE', true, 5, 0),
  (7, 7, 'T07', 'Terrasse T07', 'terrasse', 'terrasse', 2, 'FREE', true, 6, 0),
  (8, 8, 'T08', 'Terrasse T08', 'terrasse', 'terrasse', 2, 'FREE', true, 7, 0),
  (9, 9, 'T09', 'Terrasse T09', 'terrasse', 'terrasse', 2, 'FREE', true, 0, 1),
  (10, 10, 'T10', 'Terrasse T10', 'terrasse', 'terrasse', 2, 'FREE', true, 1, 1),
  (11, 11, 'T11', 'Terrasse T11', 'terrasse', 'terrasse', 2, 'FREE', true, 2, 1),
  (12, 12, 'T12', 'Terrasse T12', 'terrasse', 'terrasse', 2, 'FREE', true, 3, 1),
  (13, 13, 'T13', 'Terrasse T13', 'terrasse', 'terrasse', 2, 'FREE', true, 4, 1),
  (14, 14, 'T14', 'Terrasse T14', 'terrasse', 'terrasse', 2, 'FREE', true, 5, 1),
  (15, 15, 'T15', 'Terrasse T15', 'terrasse', 'terrasse', 4, 'FREE', true, 6, 1),
  (16, 16, 'T16', 'Terrasse T16', 'terrasse', 'terrasse', 4, 'FREE', true, 7, 1),
  (17, 17, 'T17', 'Terrasse T17', 'terrasse', 'terrasse', 4, 'FREE', true, 0, 2),
  (18, 18, 'T18', 'Terrasse T18', 'terrasse', 'terrasse', 4, 'FREE', true, 1, 2),
  (19, 19, 'T19', 'Terrasse T19', 'terrasse', 'terrasse', 4, 'FREE', true, 2, 2),
  (20, 20, 'T20', 'Terrasse T20', 'terrasse', 'terrasse', 4, 'FREE', true, 3, 2),
  (21, 21, 'T21', 'Terrasse T21', 'terrasse', 'terrasse', 4, 'FREE', true, 4, 2),
  (22, 22, 'T22', 'Terrasse T22', 'terrasse', 'terrasse', 4, 'FREE', true, 5, 2),
  (23, 23, 'T23', 'Terrasse T23', 'terrasse', 'terrasse', 4, 'FREE', true, 6, 2),
  (24, 24, 'T24', 'Terrasse T24', 'terrasse', 'terrasse', 4, 'FREE', true, 7, 2),
  (25, 25, 'T25', 'Terrasse T25', 'terrasse', 'terrasse', 4, 'FREE', true, 0, 3),
  (26, 26, 'T26', 'Terrasse T26', 'terrasse', 'terrasse', 4, 'FREE', true, 1, 3),
  (27, 27, 'T27', 'Terrasse T27', 'terrasse', 'terrasse', 4, 'FREE', true, 2, 3),
  (28, 28, 'T28', 'Terrasse T28', 'terrasse', 'terrasse', 4, 'FREE', true, 3, 3),
  (29, 29, 'T29', 'Terrasse T29', 'terrasse', 'terrasse', 4, 'FREE', true, 4, 3),
  (30, 30, 'T30', 'Terrasse T30', 'terrasse', 'terrasse', 4, 'FREE', true, 5, 3),
  (31, 31, 'T31', 'Terrasse T31', 'terrasse', 'terrasse', 4, 'FREE', true, 6, 3),
  (32, 32, 'T32', 'Terrasse T32', 'terrasse', 'terrasse', 4, 'FREE', true, 7, 3),
  (33, 33, 'T33', 'Terrasse T33', 'terrasse', 'terrasse', 4, 'FREE', true, 0, 4),
  (34, 34, 'T34', 'Terrasse T34', 'terrasse', 'terrasse', 4, 'FREE', true, 1, 4),
  (35, 35, 'T35', 'Terrasse T35', 'terrasse', 'terrasse', 6, 'FREE', true, 2, 4),
  (36, 36, 'T36', 'Terrasse T36', 'terrasse', 'terrasse', 6, 'FREE', true, 3, 4),
  (37, 37, 'T37', 'Terrasse T37', 'terrasse', 'terrasse', 6, 'FREE', true, 4, 4),
  (38, 38, 'T38', 'Terrasse T38', 'terrasse', 'terrasse', 6, 'FREE', true, 5, 4),
  (39, 39, 'T39', 'Terrasse T39', 'terrasse', 'terrasse', 6, 'FREE', true, 6, 4),
  (40, 40, 'T40', 'Terrasse T40', 'terrasse', 'terrasse', 6, 'FREE', true, 7, 4),
  (41, 41, 'N01', 'Nofra N01', 'nofra', 'nofra', 4, 'FREE', true, 0, 0),
  (42, 42, 'N02', 'Nofra N02', 'nofra', 'nofra', 4, 'FREE', true, 1, 0),
  (43, 43, 'N03', 'Nofra N03', 'nofra', 'nofra', 4, 'FREE', true, 2, 0),
  (44, 44, 'N04', 'Nofra N04', 'nofra', 'nofra', 4, 'FREE', true, 3, 0),
  (45, 45, 'N05', 'Nofra N05', 'nofra', 'nofra', 4, 'FREE', true, 0, 1),
  (46, 46, 'N06', 'Nofra N06', 'nofra', 'nofra', 4, 'FREE', true, 1, 1),
  (47, 47, 'N07', 'Nofra N07', 'nofra', 'nofra', 4, 'FREE', true, 2, 1),
  (48, 48, 'N08', 'Nofra N08', 'nofra', 'nofra', 4, 'FREE', true, 3, 1),
  (49, 49, 'N09', 'Nofra N09', 'nofra', 'nofra', 6, 'FREE', true, 0, 2),
  (50, 50, 'N10', 'Nofra N10', 'nofra', 'nofra', 6, 'FREE', true, 1, 2),
  (51, 51, 'N11', 'Nofra N11', 'nofra', 'nofra', 6, 'FREE', true, 2, 2),
  (52, 52, 'N12', 'Nofra N12', 'nofra', 'nofra', 6, 'FREE', true, 3, 2),
  (53, 53, 'N13', 'Nofra N13', 'nofra', 'nofra', 6, 'FREE', true, 0, 3),
  (54, 54, 'N14', 'Nofra N14', 'nofra', 'nofra', 6, 'FREE', true, 1, 3),
  (55, 55, 'C01', 'Salle centrale C01', 'central', 'central', 6, 'FREE', true, 0, 0),
  (56, 56, 'C02', 'Salle centrale C02', 'central', 'central', 6, 'FREE', true, 1, 0),
  (57, 57, 'C03', 'Salle centrale C03', 'central', 'central', 4, 'FREE', true, 2, 0),
  (58, 58, 'C04', 'Salle centrale C04', 'central', 'central', 4, 'FREE', true, 3, 0),
  (59, 59, 'C05', 'Salle centrale C05', 'central', 'central', 4, 'FREE', true, 0, 1),
  (60, 60, 'C06', 'Salle centrale C06', 'central', 'central', 4, 'FREE', true, 1, 1),
  (61, 61, 'C07', 'Salle centrale C07', 'central', 'central', 4, 'FREE', true, 2, 1),
  (62, 62, 'C08', 'Salle centrale C08', 'central', 'central', 4, 'FREE', true, 3, 1),
  (63, 63, 'C09', 'Salle centrale C09', 'central', 'central', 4, 'FREE', true, 0, 2),
  (64, 64, 'C10', 'Salle centrale C10', 'central', 'central', 10, 'FREE', true, 1, 2)
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

-- Garantir l'unicité des codes (au cas où conflit sur table_number)
UPDATE restaurant_tables SET is_active = false
WHERE is_active = true
  AND table_code NOT IN ('T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12', 'T13', 'T14', 'T15', 'T16', 'T17', 'T18', 'T19', 'T20', 'T21', 'T22', 'T23', 'T24', 'T25', 'T26', 'T27', 'T28', 'T29', 'T30', 'T31', 'T32', 'T33', 'T34', 'T35', 'T36', 'T37', 'T38', 'T39', 'T40', 'N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09', 'N10', 'N11', 'N12', 'N13', 'N14', 'C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10');

COMMIT;

COMMENT ON TABLE restaurant_tables IS 'Plan Jannat Bloudan : 64 tables (terrasse/nofra/central). QR → /table/{code}/menu';
