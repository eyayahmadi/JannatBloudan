#!/usr/bin/env node
/**
 * Bootstrap a fresh Supabase project after the old one is dead/paused.
 *
 * Prérequis (.env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL=postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres
 *
 * Usage :
 *   node --env-file=.env.local scripts/bootstrap-new-supabase.mjs
 */
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

function loadEnvLocal() {
  const p = resolve(root, ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const dbUrl = process.env.DATABASE_URL?.trim()

function fail(msg) {
  console.error(`\n❌  ${msg}\n`)
  process.exit(1)
}

function ok(msg) {
  console.log(`✅  ${msg}`)
}

function step(n, title) {
  console.log(`\n——— Étape ${n} : ${title} ———`)
}

function looksPlaceholder(v) {
  if (!v) return true
  return /your-project|your-anon|your-service|xxxxx|placeholder/i.test(v)
}

step(1, "Vérifier .env.local")
if (looksPlaceholder(url)) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL manquant ou placeholder.\n" +
      "Créez un NOUVEAU projet sur https://supabase.com/dashboard → Settings → API → Project URL",
  )
}
if (looksPlaceholder(anon)) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY manquant ou placeholder.")
if (looksPlaceholder(service)) fail("SUPABASE_SERVICE_ROLE_KEY manquant ou placeholder.")
if (!dbUrl || !dbUrl.includes("supabase.co")) {
  fail(
    "DATABASE_URL manquant.\n" +
      "Supabase → Settings → Database → Connection string → URI\n" +
      "Exemple : postgresql://postgres:VOTRE_MDP@db.VOTRE_REF.supabase.co:5432/postgres",
  )
}

ok(`URL projet : ${url}`)

step(2, "Tester la connexion Postgres")
let pg
try {
  pg = await import("pg")
} catch {
  fail("Package 'pg' manquant. Lancez : npm install --no-save pg")
}

const { Client } = pg.default ?? pg
const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 15000 })
try {
  await client.connect()
  const { rows } = await client.query("SELECT current_database(), version()")
  ok(`Connecté à ${rows[0]?.current_database}`)
  await client.end()
} catch (e) {
  fail(
    `Impossible de se connecter à la base :\n${e instanceof Error ? e.message : e}\n\n` +
      "Vérifiez le mot de passe DATABASE_URL et que le projet Supabase est ACTIF (pas Paused).",
  )
}

function runNode(script, label) {
  return new Promise((resolvePromise, reject) => {
    console.log(`\n▶  ${label}…`)
    const child = spawn(process.execPath, [script], {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    })
    child.on("exit", (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`${label} a échoué (code ${code})`))
    })
  })
}

step(3, "Appliquer toutes les migrations SQL")
try {
  await runNode(resolve(__dirname, "run-migrations.mjs"), "Migrations")
  ok("Schéma + menu + RLS appliqués")
} catch (e) {
  fail(e instanceof Error ? e.message : String(e))
}

step(4, "Créer les comptes de test (Auth)")
try {
  await runNode(resolve(__dirname, "seed-test-accounts.mjs"), "Comptes test")
  ok("Comptes staff créés")
} catch (e) {
  console.warn(`⚠️  Comptes test : ${e instanceof Error ? e.message : e}`)
  console.warn("   Vous pourrez relancer : npm run seed:test-accounts")
}

step(5, "Auth Supabase — à faire dans le dashboard (2 min)")
const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
console.log(`
Dans Supabase → Authentication → URL Configuration :

  Site URL : ${site}

  Redirect URLs (ajouter chaque ligne) :
    ${site}/auth/confirm
    ${site}/login
    ${site}/**

  Désactiver temporairement la confirmation e-mail (dev) :
    Authentication → Providers → Email → Confirm email = OFF
    (sinon les comptes test ne pourront pas se connecter tout de suite)
`)

step(6, "Démarrer l'app")
console.log(`
  npm run dev

  Comptes test (mot de passe par défaut TestAllRoles1!) :
    admin@test.local
    server@test.local
    kitchen@test.local
    cashier@test.local

  Menu QR : http://localhost:3000/table/1/menu
  Admin   : http://localhost:3000/admin
`)

console.log("\n✅  Bootstrap terminé — vous pouvez travailler ce soir sans attendre demain.\n")
