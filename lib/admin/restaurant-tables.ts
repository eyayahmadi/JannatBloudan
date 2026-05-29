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

import { getClientPublicSiteUrl } from "@/lib/site/public-url"

export function publicTableUrl(siteUrl: string, tableCode: string) {
  const base = siteUrl.replace(/\/$/, "")
  return `${base}/table/${encodeURIComponent(tableCode)}`
}

/**
 * Image QR (api.qrserver.com). Le param `version` (cache-buster) est ajouté
 * uniquement quand demandé : utile pour le bouton « Regénérer QR » qui force
 * un re-fetch des images côté navigateur.
 */
export function qrImageUrlForTable(
  siteUrl: string,
  tableCode: string,
  size = 220,
  version?: string | number,
) {
  const target = publicTableUrl(siteUrl, tableCode)
  const v = version ? `&v=${encodeURIComponent(String(version))}` : ""
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}${v}`
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
 * Base URL : déléguée à `getClientPublicSiteUrl()` (helper central).
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
  const base = getClientPublicSiteUrl()
  if (!base) return `/table/${encodeURIComponent(ref)}`
  return publicTableUrl(base, ref)
}
