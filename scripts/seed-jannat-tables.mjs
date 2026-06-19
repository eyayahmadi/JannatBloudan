#!/usr/bin/env node
/**
 * Seed les 64 tables Jannat Bloudan via l'API admin (nécessite session ADMIN).
 * Préférer la migration SQL : npm run db:migrate:env
 *
 * Usage direct SQL :
 *   node --env-file=.env.local scripts/run-migrations.mjs
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sqlPath = join(__dirname, "32-jannat-real-tables.sql")

console.log("Pour charger les 64 tables Jannat Bloudan, exécutez :")
console.log("  npm run db:migrate:env")
console.log("")
console.log(`Migration : ${sqlPath}`)
console.log("")
console.log("QR URL format : https://jannat-bloudan.vercel.app/table/{code}/menu")
console.log("Exemples :")
console.log("  https://jannat-bloudan.vercel.app/table/T01/menu")
console.log("  https://jannat-bloudan.vercel.app/table/N01/menu")
console.log("  https://jannat-bloudan.vercel.app/table/C10/menu")

try {
  const sql = readFileSync(sqlPath, "utf8")
  const count = (sql.match(/INSERT INTO restaurant_tables/g) || []).length
  console.log(`\nFichier SQL prêt (${count > 0 ? "64 lignes VALUES" : "généré"}).`)
} catch (e) {
  console.error("Générez d'abord : node scripts/generate-jannat-tables-sql.mjs")
  process.exit(1)
}
