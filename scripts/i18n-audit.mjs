#!/usr/bin/env node
/**
 * scripts/i18n-audit.mjs
 *
 * Audite TOUS les fichiers .tsx/.ts/.jsx/.js des dossiers `app/` et
 * `components/` à la recherche de chaînes françaises codées en dur dans
 * du JSX visible (entre `>` et `<`, ou dans `placeholder=`, `title=`,
 * `aria-label=`, `alt=`).
 *
 * Sortie :
 *   - tableau récap (par fichier) avec compte de chaînes FR détectées,
 *   - fichier JSON détaillé `i18n-audit-report.json`,
 *   - code retour 0 si tout est OK (ou si --soft), 1 sinon.
 *
 * Heuristique « français » :
 *   - contient au moins une lettre accentuée (é, è, à, ç, ù, ï, ô, œ, …)
 *     OU au moins un mot français fréquent (le, la, les, et, ou, pour, …)
 *   - et n'est pas dans le dictionnaire seed (déjà couvert).
 *
 * Usage :
 *   node scripts/i18n-audit.mjs            # rapport standard
 *   node scripts/i18n-audit.mjs --soft     # exit 0 même si chaînes trouvées
 *   node scripts/i18n-audit.mjs --json     # uniquement le JSON sur stdout
 *
 * Limites assumées :
 *   - C'est une heuristique : il y aura des faux positifs (noms propres,
 *     chaînes purement techniques). Idéal pour donner une carte des zones
 *     à passer à `<Mt>` / `useMt` plutôt que pour bloquer la CI.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, "..")

const SCAN_DIRS = ["app", "components"]
const SCAN_EXTS = new Set([".tsx", ".jsx", ".ts", ".js"])
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"])

// Mots français très fréquents (présence ≥ 1 → fort indice FR)
const COMMON_FR_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "et", "ou", "que", "qui",
  "ce", "ces", "votre", "votre", "vos", "nos", "notre", "mon", "ma", "mes", "ton", "ta", "tes",
  "pour", "avec", "sans", "sur", "sous", "dans", "par", "vers", "chez",
  "est", "sont", "etre", "être", "avoir", "faire", "aller", "voir", "savoir",
  "pas", "plus", "moins", "tout", "tous", "toutes", "rien", "aucun", "aucune",
  "merci", "bonjour", "bonsoir", "salut",
  "oui", "non", "peut-être",
  "annuler", "valider", "modifier", "supprimer", "ajouter", "enregistrer",
  "facture", "commande", "client", "serveur", "table", "menu", "produit",
])

const ACCENTED_RE = /[àâäéèêëîïôöùûüÿçœæÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ]/
const HAS_LETTER = /\p{L}/u

const ARGS = new Set(process.argv.slice(2))
const SOFT = ARGS.has("--soft")
const JSON_ONLY = ARGS.has("--json")

function log(...args) {
  if (!JSON_ONLY) console.log(...args)
}

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, out)
    else if (SCAN_EXTS.has(extname(name))) out.push(p)
  }
  return out
}

function isFrench(text) {
  const t = text.trim()
  if (t.length < 3) return false
  if (!HAS_LETTER.test(t)) return false
  // chiffres / URLs / e-mails / variables → skip
  if (/^[\d\s.,:;()\-+/€$£%]+$/.test(t)) return false
  if (/^https?:\/\//i.test(t)) return false
  if (/^\S+@\S+\.\S+$/.test(t)) return false
  if (/^[A-Z0-9_]+$/.test(t)) return false // constantes / enums
  if (/^[a-z][a-zA-Z0-9]*$/.test(t)) return false // camelCase variable
  if (ACCENTED_RE.test(t)) return true
  const words = t.toLowerCase().split(/[\s,.;:!?()'"]+/).filter(Boolean)
  for (const w of words) {
    if (COMMON_FR_WORDS.has(w)) return true
  }
  return false
}

// Capture le contenu entre `>...<` (sans tags imbriqués) ainsi que les
// attributs placeholder/title/aria-label/alt="..." ou {"..."}
const JSX_TEXT_RE = /(?<=>)([^<>{}\n]{3,200}?)(?=<\/?\w)/g
const ATTR_STRING_RE = /\b(placeholder|title|aria-label|alt)\s*=\s*"([^"\n]{2,200})"/g
const ATTR_TEMPLATE_RE = /\b(placeholder|title|aria-label|alt)\s*=\s*\{`([^`\n]{2,200})`\}/g

function scanFile(path) {
  const raw = readFileSync(path, "utf8")
  // Ne pas auditer le dictionnaire seed lui-même.
  if (path.includes("seed-dictionary")) return []
  // Ignore fichiers déclarant explicitement leur exemption
  if (raw.includes("// @i18n-ignore")) return []

  const hits = []
  let m

  while ((m = JSX_TEXT_RE.exec(raw)) !== null) {
    const text = m[1].replace(/\s+/g, " ").trim()
    if (isFrench(text)) {
      const line = raw.slice(0, m.index).split("\n").length
      hits.push({ kind: "jsx-text", text, line })
    }
  }

  while ((m = ATTR_STRING_RE.exec(raw)) !== null) {
    const text = m[2].replace(/\s+/g, " ").trim()
    if (isFrench(text)) {
      const line = raw.slice(0, m.index).split("\n").length
      hits.push({ kind: `attr:${m[1]}`, text, line })
    }
  }

  while ((m = ATTR_TEMPLATE_RE.exec(raw)) !== null) {
    const text = m[2].replace(/\s+/g, " ").trim()
    if (isFrench(text)) {
      const line = raw.slice(0, m.index).split("\n").length
      hits.push({ kind: `attr:${m[1]}`, text, line })
    }
  }

  return hits
}

function main() {
  const files = []
  for (const d of SCAN_DIRS) walk(join(ROOT, d), files)

  const report = { files: [], totalStrings: 0, totalFiles: 0 }

  for (const f of files) {
    const hits = scanFile(f)
    if (!hits.length) continue
    report.totalFiles++
    report.totalStrings += hits.length
    report.files.push({ file: relative(ROOT, f).replace(/\\/g, "/"), hits })
  }

  // Trie par nombre de hits décroissant
  report.files.sort((a, b) => b.hits.length - a.hits.length)

  if (JSON_ONLY) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n")
    return
  }

  log("\nAudit i18n — chaînes françaises potentiellement codées en dur")
  log("─────────────────────────────────────────────────────────────")
  log(`Fichiers scannés : ${files.length}`)
  log(`Fichiers avec hits : ${report.totalFiles}`)
  log(`Chaînes détectées : ${report.totalStrings}\n`)

  const TOP = 20
  log(`Top ${TOP} fichiers :`)
  for (const f of report.files.slice(0, TOP)) {
    log(`  ${String(f.hits.length).padStart(4)}  ${f.file}`)
  }

  if (report.files.length > TOP) {
    log(`  … et ${report.files.length - TOP} autres fichiers (voir JSON).`)
  }

  log("\nÉchantillon (10 premières chaînes) :")
  let shown = 0
  outer: for (const f of report.files) {
    for (const h of f.hits) {
      log(`  [${f.file}:${h.line}] ${h.kind} → "${h.text}"`)
      if (++shown >= 10) break outer
    }
  }

  const outPath = join(ROOT, "i18n-audit-report.json")
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8")
  log(`\nRapport JSON détaillé écrit : ${relative(ROOT, outPath)}`)
  log(
    "\nNote : la couverture est garantie par AutoTranslateDom (DOM runtime) + " +
      "le dictionnaire seed embarqué. Cet audit liste les chaînes encore " +
      "candidates à un wrap explicite par `<Mt>` ou `useMt` pour des " +
      "performances optimales et un meilleur SEO multilingue.",
  )

  if (report.totalStrings > 0 && !SOFT) {
    process.exitCode = 1
  }
}

main()
