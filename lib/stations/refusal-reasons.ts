/**
 * Raisons codifiées de refus d'un item par la station de production.
 * --------------------------------------------------------------------
 * Le code est stocké en base (`order_items.refusal_reason`) afin de permettre
 * des stats fiables. Le label affiché est traduit via les clés i18n.
 */

export const REFUSAL_REASON_CODES = [
  "produit_indisponible",
  "ingredient_manquant",
  "rush",
  "station_fermee",
  "fin_service",
  "remplacement_necessaire",
  "autre",
] as const

export type RefusalReasonCode = (typeof REFUSAL_REASON_CODES)[number]

export const REFUSAL_REASON_META: Record<
  RefusalReasonCode,
  { i18nKey: string; tone: "danger" | "warn" | "muted"; allowReplacement: boolean }
> = {
  produit_indisponible: {
    i18nKey: "stations.refusalReason.produitIndisponible",
    tone: "danger",
    allowReplacement: true,
  },
  ingredient_manquant: {
    i18nKey: "stations.refusalReason.ingredientManquant",
    tone: "danger",
    allowReplacement: true,
  },
  rush: {
    i18nKey: "stations.refusalReason.rush",
    tone: "warn",
    allowReplacement: true,
  },
  station_fermee: {
    i18nKey: "stations.refusalReason.stationFermee",
    tone: "muted",
    allowReplacement: false,
  },
  fin_service: {
    i18nKey: "stations.refusalReason.finService",
    tone: "muted",
    allowReplacement: false,
  },
  remplacement_necessaire: {
    i18nKey: "stations.refusalReason.remplacementNecessaire",
    tone: "warn",
    allowReplacement: true,
  },
  autre: {
    i18nKey: "stations.refusalReason.autre",
    tone: "muted",
    allowReplacement: true,
  },
}

export function isRefusalReasonCode(v: unknown): v is RefusalReasonCode {
  return typeof v === "string" && (REFUSAL_REASON_CODES as readonly string[]).includes(v)
}

/** Suggère une raison automatique selon l'état de disponibilité de la station. */
export function autoReasonForStatus(
  status: "PAUSED" | "CLOSED" | "BUSY" | "CLOSING_SOON",
): RefusalReasonCode {
  if (status === "CLOSED" || status === "PAUSED") return "station_fermee"
  if (status === "CLOSING_SOON") return "fin_service"
  return "rush"
}
