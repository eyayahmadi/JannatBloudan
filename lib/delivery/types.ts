/**
 * Delivery Tracking — Types partages
 * ------------------------------------
 * Modele de donnees pour les livraisons avec geolocalisation en temps reel.
 */

export type DeliveryStatus =
  | "pending"          // en attente d'assignation
  | "assigned"         // livreur assigne
  | "picked_up"        // commande recuperee au restaurant
  | "en_route"         // en route vers le client
  | "arrived"          // arrive sur place
  | "delivered"        // livree
  | "cancelled"        // annulee
  | "problem"          // probleme signale

export type PaymentStatus = "paid" | "cash_on_delivery" | "pending"

export type GeoPoint = {
  lat: number
  lng: number
}

export type DeliveryTracking = {
  id: string
  order_id: string
  order_number: string
  driver_id?: string | null
  driver_name?: string
  driver_phone?: string
  driver_photo?: string
  driver_rating?: number
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_notes?: string
  pickup_location: GeoPoint
  delivery_location: GeoPoint
  driver_location?: GeoPoint | null
  status: DeliveryStatus
  payment_status: PaymentStatus
  total_amount: number
  /** Timestamps */
  created_at: string
  assigned_at?: string | null
  picked_up_at?: string | null
  en_route_at?: string | null
  delivered_at?: string | null
  /** ETA en minutes (calcule) */
  estimated_minutes?: number
  /** Items pour recap */
  items?: { name: string; name_ar?: string | null; quantity: number }[]
}

/**
 * Ordre des transitions autorisees
 */
export const DELIVERY_STATUS_FLOW: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picked_up", "cancelled", "problem"],
  picked_up: ["en_route", "problem"],
  en_route: ["arrived", "problem"],
  arrived: ["delivered", "problem"],
  delivered: [],
  cancelled: [],
  problem: ["assigned", "cancelled"],
}

export type DeliveryStatusMeta = {
  i18nKey: string
  color: string
  step: number
}

export const DELIVERY_STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> = {
  pending:    { i18nKey: "driver.status.pending",    color: "bg-slate-500",  step: 0 },
  assigned:   { i18nKey: "driver.status.assigned",   color: "bg-blue-500",   step: 1 },
  picked_up:  { i18nKey: "driver.status.picked_up",  color: "bg-amber-500",  step: 2 },
  en_route:   { i18nKey: "driver.status.en_route",   color: "bg-indigo-500", step: 3 },
  arrived:    { i18nKey: "driver.status.arrived",    color: "bg-purple-500", step: 4 },
  delivered:  { i18nKey: "driver.status.delivered",  color: "bg-emerald-500", step: 5 },
  cancelled:  { i18nKey: "driver.status.cancelled",  color: "bg-rose-600",   step: -1 },
  problem:    { i18nKey: "driver.status.problem",    color: "bg-orange-600", step: -2 },
}

/**
 * Calcule la distance Haversine entre deux points GPS en km.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371 // rayon Terre km
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Estime le temps d'arrivee en minutes depuis la position livreur
 * jusqu'au client. Vitesse moyenne urbaine : 25 km/h.
 */
export function estimateEtaMinutes(
  driver: GeoPoint,
  destination: GeoPoint,
  avgSpeedKmh = 25,
): number {
  const km = haversineKm(driver, destination)
  const minutes = (km / avgSpeedKmh) * 60
  return Math.max(1, Math.round(minutes))
}
