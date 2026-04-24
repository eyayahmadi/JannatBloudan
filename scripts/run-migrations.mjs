#!/usr/bin/env node
/**
 * Applique les migrations SQL sur Postgres / Supabase.
 *
 * Usage:
 *   1. npm install --no-save pg
 *   2. $env:DATABASE_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
 *   3. node scripts/run-migrations.mjs
 *
 * Tu trouves DATABASE_URL dans :
 *   Supabase → Project Settings → Database → Connection string (URI)
 *   Prends le mode "Session / Transaction pooler" et remplace [YOUR-PASSWORD].
 */

import { readFile } from "node:fs/promises"
import { readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const here = __dirname

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL n'est pas defini.")
  console.error('   PowerShell : $env:DATABASE_URL="postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"')
  console.error("   Bash       : export DATABASE_URL='postgres://...'")
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

const migrationFiles = readdirSync(here)
  .filter((f) => /^\d{2}-.*\.sql$/.test(f))
  .sort()

if (migrationFiles.length === 0) {
  console.error("❌  Aucun fichier de migration trouve.")
  process.exit(1)
}

console.log("📄  Migrations detectees :")
migrationFiles.forEach((f) => console.log("   •", f))

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log("\n✅  Connecte a la base.")

  for (const file of migrationFiles) {
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

  const rolesRes = await client.query(
    "SELECT name, auth_level FROM user_roles ORDER BY auth_level, name",
  )
  const tablesRes = await client.query("SELECT count(*)::int AS n FROM restaurant_tables")
  const tableListRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'restaurant_tables','table_sessions','table_alerts','event_tickets',
        'client_memory','chat_sessions','product_analytics','agent_decisions',
        'staff_profiles'
      )
    ORDER BY table_name
  `)

  console.log("\n═════════════════════════════════════════════════")
  console.log("  ✅  MIGRATIONS APPLIQUEES")
  console.log("═════════════════════════════════════════════════")
  console.log(`  Roles (${rolesRes.rowCount}) :`)
  rolesRes.rows.forEach((r) => console.log(`     - ${r.name}  →  ${r.auth_level}`))
  console.log(`\n  Tables restaurant seedees : ${tablesRes.rows[0].n}`)
  console.log(`\n  Nouvelles tables creees (${tableListRes.rowCount}/9) :`)
  tableListRes.rows.forEach((r) => console.log(`     ✔ ${r.table_name}`))
  console.log("═════════════════════════════════════════════════\n")
} finally {
  await client.end()
}
