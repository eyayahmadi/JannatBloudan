/**
 * Données de démo du portail client (commandes fictives, promos, etc.).
 *
 * - Production (`next build`) : désactivé par défaut (aucune donnée factice).
 * - Développement (`next dev`) : activé par défaut pour préserver l’aperçu local.
 * - Forcer : `NEXT_PUBLIC_SHOW_PORTAL_DEMO=1` ou `NEXT_PUBLIC_SHOW_DEMO=1`
 * - Désactiver partout : `NEXT_PUBLIC_SHOW_PORTAL_DEMO=0`
 */
function triStateEnv(name: string): boolean | undefined {
  const v = process.env[name]
  if (typeof v !== "string" || v.length === 0) return undefined
  const s = v.toLowerCase().trim()
  if (["1", "true", "yes", "on"].includes(s)) return true
  if (["0", "false", "no", "off"].includes(s)) return false
  return undefined
}

export function isPortalDemoEnabled(): boolean {
  const explicit =
    triStateEnv("NEXT_PUBLIC_SHOW_PORTAL_DEMO") ?? triStateEnv("NEXT_PUBLIC_SHOW_DEMO")
  if (explicit !== undefined) return explicit
  return process.env.NODE_ENV === "development"
}
