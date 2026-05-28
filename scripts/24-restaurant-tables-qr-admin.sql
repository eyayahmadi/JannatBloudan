-- =============================================================================
-- Migration 24 — Gestion admin Tables QR : codes URL, plan de salle, zones,
-- désactivation. Idempotent. Après 04-qr-flow et 18-advanced-table-pos.
-- =============================================================================

ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS display_name VARCHAR(120);
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS table_code VARCHAR(48);
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS plan_zone VARCHAR(32) NOT NULL DEFAULT 'salle';
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS position_x REAL NOT NULL DEFAULT 0;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS position_y REAL NOT NULL DEFAULT 0;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

UPDATE restaurant_tables SET table_code = 't' || id::text WHERE table_code IS NULL OR btrim(table_code) = '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_restaurant_tables_table_code ON restaurant_tables(table_code);

-- Ancienne zone « gaming » → événement
UPDATE restaurant_tables SET zone = 'evenement' WHERE zone = 'gaming';

-- Placement plan (3 colonnes : terrasse | salle | interieur)
UPDATE restaurant_tables SET plan_zone = 'terrasse' WHERE zone = 'terrasse';
UPDATE restaurant_tables SET plan_zone = 'interieur' WHERE zone IN ('interieur', 'evenement');
UPDATE restaurant_tables SET plan_zone = 'salle' WHERE zone IN ('salle', 'vip');

COMMENT ON COLUMN restaurant_tables.display_name IS 'Libellé optionnel affiché au client (ex. Table terrasse nord).';
COMMENT ON COLUMN restaurant_tables.table_code IS 'Identifiant URL unique pour /table/{code} (scan QR).';
COMMENT ON COLUMN restaurant_tables.zone IS 'Zone métier : salle | terrasse | interieur | vip | evenement';
COMMENT ON COLUMN restaurant_tables.plan_zone IS 'Colonne plan visuel : terrasse | salle | interieur';
COMMENT ON COLUMN restaurant_tables.status IS 'FREE | OCCUPIED | RESERVED | CLEANING | … (workflow service + admin)';
