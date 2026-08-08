#!/usr/bin/env node
/**
 * Test Supabase Postgres connectivity (all fallback modes).
 *
 * Usage:
 *   npm run db:test-connection
 */
import pg from "pg"
import { buildPgConnectionCandidates, connectPgWithFallback } from "./lib/pg-connect.mjs"

console.log("🔌  Test connexion Postgres Supabase\n")

for (const { label } of buildPgConnectionCandidates()) {
  console.log(`  • ${label}`)
}
console.log("")

try {
  const { client, label } = await connectPgWithFallback(pg)
  const { rows } = await client.query("SELECT current_user, current_database(), version()")
  console.log(`   user=${rows[0].current_user}`)
  console.log(`   db=${rows[0].current_database}`)
  console.log(`   via=${label}`)
  await client.end()
  console.log("\n✅  Connexion OK — vous pouvez lancer npm run db:migrate:env")
} catch (error) {
  console.error(`\n❌  ${error instanceof Error ? error.message : error}\n`)
  process.exit(1)
}
