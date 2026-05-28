/** Métadonnées zones / plan pour l’admin Tables QR (aligné migration 24 + UX). */

export const TABLE_BUSINESS_ZONES = ["salle", "terrasse", "interieur", "vip", "evenement"] as const
export type TableBusinessZone = (typeof TABLE_BUSINESS_ZONES)[number]

export const TABLE_PLAN_ZONES = ["terrasse", "salle", "interieur"] as const
export type TablePlanZone = (typeof TABLE_PLAN_ZONES)[number]

/** Statuts éditables côté admin (complète le workflow FREE…PAID côté service). */
export const TABLE_ADMIN_STATUSES = [
  "FREE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "ORDERING",
  "IN_KITCHEN",
  "READY",
  "SERVED",
  "PAYMENT_REQUESTED",
  "PAID",
  "CALL_SERVER",
] as const
export type TableAdminStatus = (typeof TABLE_ADMIN_STATUSES)[number]

export const ZONE_LABELS_FR: Record<string, string> = {
  salle: "Salle",
  terrasse: "Terrasse",
  interieur: "Intérieur",
  vip: "VIP",
  evenement: "Événement",
  // legacy
  gaming: "Événement",
}

export const PLAN_ZONE_LABELS_FR: Record<string, string> = {
  terrasse: "Plan — Terrasse",
  salle: "Plan — Salle",
  interieur: "Plan — Intérieur",
}

export const STATUS_LABELS_FR: Record<string, string> = {
  FREE: "Libre",
  OCCUPIED: "Occupée",
  RESERVED: "Réservée",
  CLEANING: "Nettoyage",
  DISABLED: "Désactivée (voir interrupteur)",
  ORDERING: "Commande en cours",
  IN_KITCHEN: "En cuisine",
  READY: "Prêt",
  SERVED: "Servi",
  PAYMENT_REQUESTED: "Addition demandée",
  PAID: "Payée",
  CALL_SERVER: "Appel serveur",
}

export function publicTableUrl(siteUrl: string, tableCode: string) {
  const base = siteUrl.replace(/\/$/, "")
  return `${base}/table/${encodeURIComponent(tableCode)}`
}

export function qrImageUrlForTable(siteUrl: string, tableCode: string, size = 220) {
  const target = publicTableUrl(siteUrl, tableCode)
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}`
}

/**
 * Calcule l'URL publique « vue client » à partir d'un objet table partiel
 * (table_code de préférence, sinon table_number numérique).
 * Utilisable côté client comme côté serveur.
 *
 * Stratégie :
 *  - `table_code` (slug)         → /table/{code}
 *  - `table_number` numérique    → /table/{number} (résolu côté public)
 *  - `id`                        → fallback `t{id}`
 *
 * Base URL :
 *  - `NEXT_PUBLIC_SITE_URL` si défini et non placeholder.
 *  - sinon `window.location.origin` côté client.
 *  - sinon chemin relatif.
 */
export function resolveClientPreviewUrl(table: {
  id?: number | null
  table_code?: string | null
  table_number?: number | string | null
}): string {
  const code = (table.table_code && String(table.table_code).trim()) || ""
  let ref = code
  if (!ref) {
    const num = Number(table.table_number)
    if (Number.isFinite(num) && num > 0) {
      ref = String(num)
    } else if (table.id) {
      ref = `t${table.id}`
    }
  }
  if (!ref) return ""
  const env =
    typeof process !== "undefined" && typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
      : ""
  const base =
    env && !/your-project-ref|placeholder|example\.com/i.test(env)
      ? env
      : typeof window !== "undefined"
        ? window.location.origin
        : ""
  if (!base) return `/table/${encodeURIComponent(ref)}`
  return publicTableUrl(base, ref)
}
