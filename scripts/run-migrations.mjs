#!/usr/bin/env node
/**
 * Applique toutes les migrations SQL sur Postgres / Supabase, dans l'ordre canonique.
 *
 * Usage:
 *   npm install --no-save pg
 *   $env:DATABASE_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
 *   node scripts/run-migrations.mjs
 *
 * Ou avec .env.local (Node 20.6+) :
 *   node --env-file=.env.local scripts/run-migrations.mjs
 *
 * Non inclus (volontairement) :
 *   - APPLY-ALL-NEW.sql, APPLY-TODAY.sql (doublons partiels de migrations numérotées)
 *   - create_admin.sql (ponctuel / données sensibles)
 *   - 07-demo-seed.sql, 09-demo-data.sql : optionnels ; retirer du tableau si tu veux une base vide
 */

import { readFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const here = __dirname

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
]

/** Après le schéma : durcissement rôles puis correctif signup / RLS audit (idempotent). */
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

console.log("📄  Migrations à appliquer :")
ALL_MIGRATIONS.forEach((f) => console.log("   •", f))

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("\n✅  Connecté à la base.")

  for (const file of ALL_MIGRATIONS) {
    const sql = await readFile(join(here, file), "utf8")
    console.log(`\n▶  Application : ${file}`)
    try {
      await client.query(sql)
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
        'staff_profiles'
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
  console.log(`\n  Tables clés présentes (${tableListRes.rowCount}/9) :`)
  tableListRes.rows.forEach((r) => console.log(`     ✔ ${r.table_name}`))
  console.log("═════════════════════════════════════════════════\n")
} finally {
  await client.end()
}
