/** Heure locale du site (restaurant) pour happy hour / créneaux promotion. */
export const SITE_BUSINESS_TIMEZONE = "Europe/Berlin"

export function getSiteHourOfDay(now: Date = new Date()): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_BUSINESS_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
  })
  const h = Number(fmt.formatToParts(now).find((p) => p.type === "hour")?.value)
  return Number.isFinite(h) ? h : now.getUTCHours()
}

export function isWithinHappyHourWindow(now: Date, range: [number, number] | undefined): boolean {
  if (!range || range.length !== 2) return true
  const [a, b] = range
  const h = getSiteHourOfDay(now)
  if (a <= b) return h >= a && h < b
  return h >= a || h < b
}
