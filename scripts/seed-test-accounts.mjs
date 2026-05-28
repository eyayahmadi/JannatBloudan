#!/usr/bin/env node
/**
 * Crée (ou met à jour) un compte Supabase Auth par rôle assignable, pour tests locaux.
 * Aligné sur ASSIGNABLE_ROLES dans lib/auth/roles.ts et POST /api/admin/users.
 *
 * Prérequis : SUPABASE_SERVICE_ROLE_KEY + URL du projet (voir ci-dessous).
 *
 * Usage (depuis le dossier pfe-main) :
 *   node --env-file=.env.local scripts/seed-test-accounts.mjs
 *   # ou, après export des variables :
 *   node scripts/seed-test-accounts.mjs
 *
 * Options env :
 *   NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (obligatoire — jamais la clé anon)
 *   TEST_ACCOUNTS_PASSWORD     (défaut : TestAllRoles1!)
 *   TEST_EMAIL_DOMAIN          (défaut : test.local) → emails {role}@{domain}
 */

import { createClient } from "@supabase/supabase-js"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

/** Même liste que ASSIGNABLE_ROLES (lib/auth/roles.ts). */
const ASSIGNABLE_ROLES = [
  "CLIENT",
  "ADMIN",
  "SERVER",
  "KITCHEN",
  "BAR",
  "SHISHA",
  "CASHIER",
  "DELIVERY",
]

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local")
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PASSWORD = process.env.TEST_ACCOUNTS_PASSWORD || "TestAllRoles1!"
const DOMAIN = (process.env.TEST_EMAIL_DOMAIN || "test.local").replace(/^@/, "")

function prettyName(role) {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

async function listAllAuthUsers(admin) {
  const all = []
  let page = 1
  const perPage = 200
  while (page <= 25) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)
    const users = data?.users ?? []
    all.push(...users)
    if (users.length < perPage) break
    page += 1
  }
  return all
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Variables manquantes : NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY.",
    )
    console.error('Exemple : node --env-file=.env.local scripts/seed-test-accounts.mjs')
    process.exit(1)
  }
  if (PASSWORD.length < 8) {
    console.error("TEST_ACCOUNTS_PASSWORD doit faire au moins 8 caractères.")
    process.exit(1)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log("Chargement des utilisateurs Auth existants…")
  const existing = await listAllAuthUsers(admin)
  const byEmail = new Map(existing.map((u) => [(u.email || "").toLowerCase(), u]))

  const rows = []

  for (const role of ASSIGNABLE_ROLES) {
    const email = `${role.toLowerCase()}@${DOMAIN}`.toLowerCase()
    const first_name = "Test"
    const last_name = prettyName(role)
    const meta = { role, first_name, last_name }

    const prev = byEmail.get(email)
    try {
      if (prev) {
        const { data, error } = await admin.auth.admin.updateUserById(prev.id, {
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { ...((prev.user_metadata || {})), ...meta },
        })
        if (error) throw new Error(error.message)
        rows.push({ email, role, action: "mis à jour", id: data.user.id })
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: meta,
        })
        if (error) throw new Error(error.message)
        rows.push({ email, role, action: "créé", id: data.user.id })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`Échec pour ${email} (${role}) :`, msg)
      if (/database error/i.test(msg)) {
        console.error(
          "  → Souvent un trigger / RLS sur public.users ou audit_logs. Exécuter dans Supabase SQL : scripts/fix-signup-database-error-updating-user.sql",
        )
      }
      process.exitCode = 1
    }
  }

  if (process.exitCode) return

  console.log("\nComptes de test (même mot de passe pour tous) :\n")
  console.log("Mot de passe :", PASSWORD)
  console.log("")
  for (const r of rows) {
    console.log(`  ${r.role.padEnd(8)}  ${r.email.padEnd(28)}  ${r.action}`)
  }
  console.log(
    "\nConnectez-vous sur /login. Ne pas utiliser ces comptes en production ; domaine et mot de passe sont pour le dev uniquement.",
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
