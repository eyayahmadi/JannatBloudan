#!/usr/bin/env node
/**
 * Applique les migrations SQL sur Postgres / Supabase — **incremental only**.
 *
 * Chaque fichier n'est exécuté qu'une seule fois (table `schema_migrations`).
 * Les modifications manuelles en base ne sont plus écrasées en relançant migrate.
 *
 * Usage:
 *   npm run db:migrate:env                    # nouvelles migrations seulement
 *   npm run db:migrate:baseline               # marquer tout comme déjà appliqué (1× sur base existante)
 *   npm run db:migrate:status                 # voir ce qui reste à appliquer
 *   npm run db:migrate:env -- --only=66-...   # un seul fichier
 *   npm run db:migrate:env -- --force-all     # ⚠️ ré-exécute TOUT (destructif)
 *
 * Non inclus (volontairement) :
 *   - APPLY-ALL-NEW.sql, APPLY-TODAY.sql
 *   - create_admin.sql
 */

import { readFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const here = __dirname

const args = process.argv.slice(2)
const BASELINE = args.includes("--baseline")
const STATUS = args.includes("--status")
const FORCE_ALL = args.includes("--force-all")
const FORCE = args.includes("--force")
const onlyArg = args.find((a) => a.startsWith("--only="))
const ONLY = onlyArg ? onlyArg.slice("--only=".length) : null

/** Ordre explicite : le tri lexicographique ne suffit pas (13-*, 20-*, 21-*). */
const NUMBERED_MIGRATIONS = [
  "01-create-database-schema.sql",
  "02-seed-initial-data.sql",
  "03-create-rpc-functions.sql",
  "04-qr-flow-and-ai-schema.sql",
  "05-roles-and-auth-alignment.sql",
  "06-commercial-ready.sql",
  "07-demo-seed.sql",
  "08-advanced.sql",
  "09-demo-data.sql",
  "10-stations.sql",
  "11-delivery-tracking.sql",
  "12-supplier-invoices.sql",
  "13-cash-register-movements.sql",
  "13-digital-menu-and-stock.sql",
  "14-caisse-intelligence-complete.sql",
  "15-caisse-complete.sql",
  "16-translation-cache.sql",
  "17-sortie-caisse-trace.sql",
  "18-advanced-table-pos.sql",
  "19-private-events-calendar.sql",
  "20-events-professional.sql",
  "20-menu-product-images-storage.sql",
  "21-audit-products-api-actor.sql",
  "21-promotions-module.sql",
  "22-categories-menu-columns.sql",
  "23-client-profiles-confirm.sql",
  "24-restaurant-tables-qr-admin.sql",
  "27-table-session-merges.sql",
  "28-external-cash-incomes.sql",
  "29-station-acceptance-and-availability.sql",
  "30-purchases-to-plan.sql",
  "31-client-credit-and-station-revenue.sql",
  "32-jannat-real-tables.sql",
  "33-jannat-bloudan-menu.sql",
  "34-menu-cms.sql",
  "35-table-session-consistency.sql",
  "36-realtime-publications.sql",
  "37-invoice-order-item-link.sql",
  "38-category-display-order.sql",
  "39-entrees-content.sql",
  "40-salades-content.sql",
  "41-manakish-content.sql",
  "42-plats-content.sql",
  "43-shawarma-content.sql",
  "44-grillades-content.sql",
  "45-pizza-content.sql",
  "46-burgers-content.sql",
  "47-sandwiches-content.sql",
  "48-cold-drinks-content.sql",
  "49-cocktails-content.sql",
  "50-coffee-content.sql",
  "51-tea-waffles-crepes-content.sql",
  "52-desserts-content.sql",
  "53-shisha-content.sql",
  "54-deprecate-legacy-categories.sql",
  "55-fix-recommendation-slugs.sql",
  "56-restore-menu-canonical.sql",
  "57-water-variants.sql",
  "58-menu-homepage-sections.sql",
  "59-order-item-bilingual-names.sql",
  "60-service-request-alerts.sql",
  "61-table-cleaning-lifecycle.sql",
  "62-order-item-options-snapshot.sql",
  "63-public-rls-hardening.sql",
  "64-sensitive-data-lockdown.sql",
  "65-tajine-hauptgerichte-categories.sql",
  "66-tajine-hauptgerichte-images.sql",
  "67-plats-ar-label.sql",
]

const POST_MIGRATIONS = ["APPLY-ROLE-HARDENING.sql", "fix-signup-database-error-updating-user.sql"]

const ALL_MIGRATIONS = [...NUMBERED_MIGRATIONS, ...POST_MIGRATIONS]

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL n'est pas defini.")
  console.error('   PowerShell : $env:DATABASE_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"')
  console.error("   Bash       : export DATABASE_URL='postgres://...'")
  console.error("   Ou         : node --env-file=.env.local scripts/run-migrations.mjs")
  process.exit(1)
}

let pgModule
try {
  pgModule = await import("pg")
} catch {
  console.error("❌  Package 'pg' manquant. Installe-le :")
  console.error("   npm install --no-save pg")
  process.exit(1)
}

const { Client } = pgModule.default

for (const file of ALL_MIGRATIONS) {
  try {
    await access(join(here, file), constants.R_OK)
  } catch {
    console.error(`❌  Fichier introuvable : ${file}`)
    process.exit(1)
  }
}

function resolveOnlyFilter(pattern) {
  const p = pattern.trim()
  if (!p) return () => false
  return (file) => file === p || file.startsWith(p) || file.includes(p)
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

async function getAppliedSet(client) {
  const res = await client.query("SELECT filename FROM schema_migrations ORDER BY filename")
  return new Set(res.rows.map((r) => r.filename))
}

async function markApplied(client, file) {
  await client.query(
    "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
    [file],
  )
}

function pickMigrations(applied) {
  if (FORCE_ALL) return [...ALL_MIGRATIONS]

  if (ONLY) {
    const match = resolveOnlyFilter(ONLY)
    const picked = ALL_MIGRATIONS.filter(match)
    if (picked.length === 0) {
      console.error(`❌  Aucune migration ne correspond à --only=${ONLY}`)
      process.exit(1)
    }
    if (FORCE || FORCE_ALL) return picked
    return picked.filter((f) => !applied.has(f))
  }

  return ALL_MIGRATIONS.filter((f) => !applied.has(f))
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("✅  Connecté à la base.")

  await ensureMigrationTable(client)
  const applied = await getAppliedSet(client)

  if (BASELINE) {
    console.log("\n📌  Baseline — marquer toutes les migrations comme déjà appliquées (sans SQL).\n")
    let marked = 0
    for (const file of ALL_MIGRATIONS) {
      if (!applied.has(file)) {
        await markApplied(client, file)
        console.log(`   ✔  ${file}`)
        marked++
      }
    }
    console.log(`\n✅  Baseline terminée : ${marked} migration(s) enregistrée(s), ${applied.size} déjà présentes.`)
    console.log("   Prochaine fois : npm run db:migrate:env → seulement les NOUVEAUX fichiers.\n")
    process.exit(0)
  }

  const pending = pickMigrations(applied)

  if (STATUS) {
    console.log("\n📋  État des migrations\n")
    for (const file of ALL_MIGRATIONS) {
      console.log(applied.has(file) ? `   ✔  ${file}` : `   ○  ${file}  (en attente)`)
    }
    console.log(`\n   Appliquées : ${applied.size}/${ALL_MIGRATIONS.length}`)
    console.log(`   En attente : ${pending.length}\n`)
    process.exit(0)
  }

  if (pending.length === 0) {
    console.log("\n✅  Rien à faire — toutes les migrations sont déjà appliquées.")
    console.log("   Voir l'état : npm run db:migrate:status\n")
    process.exit(0)
  }

  if (FORCE_ALL) {
    console.warn("\n⚠️  --force-all : ré-exécution de TOUTES les migrations (peut écraser des données).\n")
  } else {
    console.log(`\n📄  Migrations à appliquer (${pending.length}) :`)
    pending.forEach((f) => console.log("   •", f))
  }

  for (const file of pending) {
    const sql = await readFile(join(here, file), "utf8")
    console.log(`\n▶  Application : ${file}`)
    try {
      await client.query(sql)
      await markApplied(client, file)
      console.log(`   ✔  ${file} OK`)
    } catch (err) {
      console.error(`   ✘  Erreur dans ${file} :`, err.message)
      process.exit(1)
    }
  }

  let rolesRes
  let tablesRes
  let tableListRes
  try {
    rolesRes = await client.query("SELECT name, auth_level FROM user_roles ORDER BY auth_level, name")
  } catch {
    rolesRes = { rowCount: 0, rows: [] }
  }
  try {
    tablesRes = await client.query("SELECT count(*)::int AS n FROM restaurant_tables")
  } catch {
    tablesRes = { rows: [{ n: 0 }] }
  }
  try {
    tableListRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'restaurant_tables','table_sessions','table_alerts','event_tickets',
        'client_memory','chat_sessions','product_analytics','agent_decisions',
        'staff_profiles','schema_migrations'
      )
    ORDER BY table_name
  `)
  } catch {
    tableListRes = { rowCount: 0, rows: [] }
  }

  console.log("\n═════════════════════════════════════════════════")
  console.log("  ✅  MIGRATIONS APPLIQUÉES")
  console.log("═════════════════════════════════════════════════")
  if (rolesRes.rows.length) {
    console.log(`  Rôles (${rolesRes.rowCount}) :`)
    rolesRes.rows.forEach((r) => console.log(`     - ${r.name}  →  ${r.auth_level}`))
  }
  console.log(`\n  Tables restaurant (seed) : ${tablesRes.rows[0].n}`)
  console.log(`\n  Tables clés présentes (${tableListRes.rowCount}) :`)
  tableListRes.rows.forEach((r) => console.log(`     ✔ ${r.table_name}`))
  console.log("═════════════════════════════════════════════════\n")
} finally {
  await client.end()
}
