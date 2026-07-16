#!/usr/bin/env node
/**
 * Cross-locale translation key parity audit.
 * Uses the TypeScript compiler API to parse message files without executing imports.
 *
 * Usage:
 *   node scripts/i18n-keys-audit.mjs
 *   node scripts/i18n-keys-audit.mjs --soft
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import ts from "typescript"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const SOFT = process.argv.includes("--soft")
const LOCALES = ["fr", "en", "de", "ar"]

const GERMAN_UI_RE =
  /\b(Umsatz|Bestellungen|Kunden|Kasse|Personal|Produkte|Kategorien|Varianten|Empfehlungen|KI-Zentrum|Lagerwarnungen)\b/g

function flatten(obj, prefix = "") {
  const out = new Map()
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [k, v] of flatten(value, path)) out.set(k, v)
    } else if (typeof value === "string") {
      out.set(path, value)
    }
  }
  return out
}

function getPropertyName(prop) {
  if (ts.isIdentifier(prop.name)) return prop.name.text
  if (ts.isStringLiteral(prop.name)) return prop.name.text
  if (ts.isComputedPropertyName(prop.name) && ts.isStringLiteral(prop.name.expression)) {
    return prop.name.expression.text
  }
  return null
}

function evalInitializer(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  if (ts.isObjectLiteralExpression(node)) {
    return objectLiteralToJson(node)
  }
  if (ts.isAsExpression(node)) return evalInitializer(node.expression)
  if (ts.isSatisfiesExpression(node)) return evalInitializer(node.expression)
  return undefined
}

function objectLiteralToJson(node) {
  const out = {}
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const key = getPropertyName(prop)
    if (!key) continue
    if (ts.isIdentifier(prop.initializer)) continue
    const value = evalInitializer(prop.initializer)
    if (value !== undefined) out[key] = value
  }
  return out
}

function parseExportConst(filePath, exportName) {
  const source = readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let result = null
  const visit = (node) => {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === exportName && decl.initializer) {
          const parsed = evalInitializer(decl.initializer)
          if (parsed && typeof parsed === "object") result = parsed
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return result
}

function mergeDeep(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {}
      mergeDeep(target[key], value)
    } else {
      target[key] = value
    }
  }
  return target
}

function loadLocaleMessages(locale) {
  const mainPath = join(ROOT, `lib/i18n/messages/${locale}.ts`)
  const main = parseExportConst(mainPath, locale === "fr" ? "fr" : locale) ?? {}

  const modules = [
    ["admin", join(ROOT, `lib/i18n/messages/admin/${locale}.ts`), "adminMessages"],
    ["workspace", join(ROOT, `lib/i18n/messages/workspace/${locale}.ts`), "workspaceMessages"],
    ["caisse", join(ROOT, `lib/i18n/messages/caisse/${locale}.ts`), "caisseMessages"],
  ]

  for (const [key, filePath, exportName] of modules) {
    const parsed = parseExportConst(filePath, exportName)
    if (parsed) main[key] = parsed
  }

  return main
}

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".next") continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, out)
    else if ([".tsx", ".jsx"].includes(extname(name))) out.push(p)
  }
  return out
}

function main() {
  const packs = {}
  for (const locale of LOCALES) {
    packs[locale] = flatten(loadLocaleMessages(locale))
  }

  const ref = packs.fr
  const issues = []

  for (const locale of LOCALES) {
    if (locale === "fr") continue
    const pack = packs[locale]
    for (const [path, value] of ref) {
      if (!pack.has(path)) {
        issues.push({ type: "missing", locale, path })
      } else if (!pack.get(path)?.trim() && ref.get(path)?.trim()) {
        issues.push({ type: "empty", locale, path })
      }
    }
    for (const path of pack.keys()) {
      if (!ref.has(path)) {
        issues.push({ type: "extra", locale, path })
      }
    }
  }

  const navPath = join(ROOT, "components/admin/admin-portal-nav.tsx")
  const navSrc = readFileSync(navPath, "utf8")
  const germanNav = [...navSrc.matchAll(/label:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((label) =>
      /^(Produkte|Kategorien|Varianten|Empfehlungen|Umsatz|Bestellungen)$/i.test(label),
    )
  for (const label of germanNav) {
    issues.push({ type: "mixed-nav", locale: "nav", path: label })
  }

  const germanHits = []
  for (const file of walk(join(ROOT, "app/admin"))) {
    const rel = relative(ROOT, file)
    const src = readFileSync(file, "utf8")
    if (rel === "app\\admin\\page.tsx" || rel === "app/admin/page.tsx") continue
    const lines = src.split("\n")
    lines.forEach((line, i) => {
      if (line.includes("t(") || line.includes("useMt(") || line.includes("useI18n")) return
      if (line.trim().startsWith("//")) return
      const m = line.match(GERMAN_UI_RE)
      if (m) germanHits.push({ file: rel, line: i + 1, word: m[0] })
    })
  }

  const missing = issues.filter((i) => i.type === "missing")
  const empty = issues.filter((i) => i.type === "empty")
  const mixedNav = issues.filter((i) => i.type === "mixed-nav")

  console.log("i18n keys audit")
  console.log("─".repeat(40))
  console.log(`Reference keys (fr): ${ref.size}`)
  for (const locale of LOCALES) {
    if (locale === "fr") continue
    console.log(`${locale}: ${packs[locale].size} keys`)
  }
  console.log(`Missing keys: ${missing.length}`)
  console.log(`Empty values: ${empty.length}`)
  console.log(`Mixed German nav labels: ${mixedNav.length}`)
  console.log(`German UI hits in admin pages: ${germanHits.length}`)

  if (empty.length) {
    console.log("\nEmpty (first 20):")
    empty.slice(0, 20).forEach((i) => console.log(`  [${i.locale}] ${i.path}`))
  }
  if (missing.length) {
    console.log("\nMissing (first 15):")
    missing.slice(0, 15).forEach((i) => console.log(`  [${i.locale}] ${i.path}`))
  }
  if (mixedNav.length) {
    console.log("\nMixed nav labels:")
    mixedNav.forEach((i) => console.log(`  ${i.path}`))
  }
  if (germanHits.length) {
    console.log("\nGerman hardcoded (first 10):")
    germanHits.slice(0, 10).forEach((h) => console.log(`  ${h.file}:${h.line} ${h.word}`))
  }

  const blocking = missing.length > 0 || empty.length > 0 || mixedNav.length > 0
  if (blocking && !SOFT) {
    process.exit(1)
  }
}

main()
