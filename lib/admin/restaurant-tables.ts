/** Métadonnées zones / plan pour l'admin Tables QR — Jannat Bloudan (66 tables). */

import { JANNAT_ZONE_LABELS, type JannatZone, menuQrUrl } from "@/lib/admin/jannat-tables-data"
import { getClientPublicSiteUrl } from "@/lib/site/public-url"

/** Zones réelles du restaurant (plan 66 tables). */
export const JANNAT_TABLE_ZONES = ["terrasse", "nofra", "central"] as const
export type JannatTableZone = (typeof JANNAT_TABLE_ZONES)[number]

/** Zones métier historiques (compat migrations antérieures). */
export const LEGACY_BUSINESS_ZONES = ["salle", "interieur", "vip", "evenement"] as const

export const TABLE_BUSINESS_ZONES = [...JANNAT_TABLE_ZONES, ...LEGACY_BUSINESS_ZONES] as const
export type TableBusinessZone = (typeof TABLE_BUSINESS_ZONES)[number]

export const TABLE_PLAN_ZONES = [...JANNAT_TABLE_ZONES] as const
export type TablePlanZone = (typeof TABLE_PLAN_ZONES)[number]

export const TABLE_CAPACITIES = [2, 4, 6, 10] as const

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
  ...JANNAT_ZONE_LABELS,
  // legacy
  salle: "Salle",
  interieur: "Intérieur",
  vip: "VIP",
  evenement: "Événement",
  gaming: "Événement",
}

export const PLAN_ZONE_LABELS_FR: Record<string, string> = {
  ...JANNAT_ZONE_LABELS,
}

export const STATUS_LABELS_FR: Record<string, string> = {
  FREE: "Libre",
  OCCUPIED: "Occupée",
  RESERVED: "Réservée",
  CLEANING: "Nettoyage",
  DISABLED: "Désactivée (voir interrupteur)",
  ORDERING: "Commande en cours",
  IN_KITCHEN: "En préparation",
  READY: "Prête à servir",
  SERVED: "Servi",
  PAYMENT_REQUESTED: "Demande addition",
  PAID: "Payée",
  CALL_SERVER: "Demande serveur",
}

export function isJannatZone(z: string): z is JannatZone {
  return (JANNAT_TABLE_ZONES as readonly string[]).includes(z)
}

export function publicTableUrl(siteUrl: string, tableCode: string) {
  const base = siteUrl.replace(/\/$/, "")
  return `${base}/table/${encodeURIComponent(tableCode)}`
}

/** URL QR client : menu digital direct (spec Jannat). */
export function publicTableMenuUrl(siteUrl: string, tableCode: string) {
  return menuQrUrl(tableCode, siteUrl)
}

/**
 * Image QR (api.qrserver.com). Pointe vers /table/{code}/menu par défaut.
 */
export function qrImageUrlForTable(
  siteUrl: string,
  tableCode: string,
  size = 220,
  version?: string | number,
  target: "menu" | "landing" = "menu",
) {
  const link =
    target === "menu" ? publicTableMenuUrl(siteUrl, tableCode) : publicTableUrl(siteUrl, tableCode)
  const v = version ? `&v=${encodeURIComponent(String(version))}` : ""
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}${v}`
}

/**
 * Calcule l'URL publique « vue client » à partir d'un objet table partiel.
 */
export function resolveClientPreviewUrl(
  table: {
    id?: number | null
    table_code?: string | null
    table_number?: number | string | null
  },
  target: "menu" | "landing" = "menu",
): string {
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
  if (!base) return `/table/${encodeURIComponent(ref)}${target === "menu" ? "/menu" : ""}`
  return target === "menu" ? publicTableMenuUrl(base, ref) : publicTableUrl(base, ref)
}
