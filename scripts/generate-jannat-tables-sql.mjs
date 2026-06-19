#!/usr/bin/env node
/**
 * Génère scripts/32-jannat-real-tables.sql à partir de lib/admin/jannat-tables-data.ts
 * Usage: node scripts/generate-jannat-tables-sql.mjs
 */
import { writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// Inline copy of build logic (évite transpilation TS)
function pad2(n) { return String(n).padStart(2, "0") }
function gridPosition(index, cols) {
  return { position_x: index % cols, position_y: Math.floor(index / cols) }
}

function buildTables() {
  const out = []
  let seq = 1
  const terrasseSpecs = [[2, 14], [4, 20], [6, 6]]
  for (const [cap, count] of terrasseSpecs) {
    for (let i = 0; i < count; i++) {
      const code = `T${pad2(seq)}`
      const pos = gridPosition(seq - 1, 8)
      out.push({ id: seq, table_number: seq, table_code: code, display_name: `Terrasse ${code}`, zone: "terrasse", plan_zone: "terrasse", capacity: cap, ...pos })
      seq++
    }
  }
  const nofraStart = seq
  const nofraSpecs = [[4, 8], [6, 6]]
  let nSeq = 1
  for (const [cap, count] of nofraSpecs) {
    for (let i = 0; i < count; i++) {
      const code = `N${pad2(nSeq)}`
      const id = nofraStart + nSeq - 1
      const pos = gridPosition(nSeq - 1, 4)
      out.push({ id, table_number: id, table_code: code, display_name: `Nofra ${code}`, zone: "nofra", plan_zone: "nofra", capacity: cap, ...pos })
      nSeq++
    }
  }
  const centralStart = nofraStart + nSeq - 1
  const centralSpecs = [[6, 2], [4, 7], [10, 1]]
  let cSeq = 1
  for (const [cap, count] of centralSpecs) {
    for (let i = 0; i < count; i++) {
      const code = `C${pad2(cSeq)}`
      const id = centralStart + cSeq - 1
      const pos = gridPosition(cSeq - 1, 4)
      out.push({ id, table_number: id, table_code: code, display_name: `Salle centrale ${code}`, zone: "central", plan_zone: "central", capacity: cap, ...pos })
      cSeq++
    }
  }
  return out
}

const tables = buildTables()
const esc = (s) => String(s).replace(/'/g, "''")

const values = tables
  .map(
    (t) =>
      `  (${t.id}, ${t.table_number}, '${esc(t.table_code)}', '${esc(t.display_name)}', '${t.zone}', '${t.plan_zone}', ${t.capacity}, 'FREE', true, ${t.position_x}, ${t.position_y})`,
  )
  .join(",\n")

const sql = `-- =============================================================================
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
   OR id > ${tables.length}
   OR table_code NOT IN (${tables.map((t) => `'${t.table_code}'`).join(", ")});

-- Upsert des 64 tables réelles
INSERT INTO restaurant_tables (
  id, table_number, table_code, display_name, zone, plan_zone,
  capacity, status, is_active, position_x, position_y
)
VALUES
${values}
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
  AND table_code NOT IN (${tables.map((t) => `'${t.table_code}'`).join(", ")});

COMMIT;

COMMENT ON TABLE restaurant_tables IS 'Plan Jannat Bloudan : 64 tables (terrasse/nofra/central). QR → /table/{code}/menu';
`

const outPath = join(ROOT, "scripts", "32-jannat-real-tables.sql")
writeFileSync(outPath, sql, "utf8")
console.log(`✓ ${tables.length} tables → ${outPath}`)
