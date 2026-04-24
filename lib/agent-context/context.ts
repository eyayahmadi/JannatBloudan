export type RushLevel = "calm" | "normal" | "rush"

export type RestaurantOperationalContext = {
  hour: number
  minute: number
  dayOfWeek: number
  isWeekend: boolean
  timeSlot: "morning" | "lunch" | "afternoon" | "dinner" | "late"
  rushLevel: RushLevel
  /** Charge synthetique 0–100 */
  loadIndex: number
  /** Conseils strategiques pour les agents */
  hints: string[]
}

function slotFromHour(h: number): RestaurantOperationalContext["timeSlot"] {
  if (h < 11) return "morning"
  if (h < 15) return "lunch"
  if (h < 17) return "afternoon"
  if (h < 22) return "dinner"
  return "late"
}

/**
 * Contexte operationnel (heure, rush simule, charge).
 * En production : alimenter par file d'attente POS / capteurs / Kafka.
 */
export function getRestaurantOperationalContext(now = new Date()): RestaurantOperationalContext {
  const hour = now.getHours()
  const minute = now.getMinutes()
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const timeSlot = slotFromHour(hour)

  let baseLoad = 35
  if (timeSlot === "lunch" || timeSlot === "dinner") baseLoad += 28
  if (isWeekend) baseLoad += 12
  const wave = Math.sin((hour + minute / 60) / 3) * 10
  const loadIndex = Math.min(100, Math.max(8, Math.round(baseLoad + wave)))

  let rushLevel: RushLevel = "normal"
  if (loadIndex >= 72) rushLevel = "rush"
  else if (loadIndex <= 32) rushLevel = "calm"

  const hints: string[] = []
  if (rushLevel === "rush") {
    hints.push("Pic de charge: prioriser plats rapides (shawarma, manakish), reduire upsell verbeux")
  } else if (rushLevel === "calm") {
    hints.push("Creux: opportunite upsell dessert / boisson premium")
  }
  if (timeSlot === "dinner") hints.push("Soiree: mettre en avant plats signatures et desserts")
  if (isWeekend) hints.push("Week-end: familles / groupes — proposer menus ou plats a partager")

  return {
    hour,
    minute,
    dayOfWeek,
    isWeekend,
    timeSlot,
    rushLevel,
    loadIndex,
    hints,
  }
}
