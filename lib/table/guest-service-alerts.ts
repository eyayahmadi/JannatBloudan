export type GuestServiceKind = "waiter" | "bill"

export type GuestServiceAlertMeta = {
  kind: GuestServiceKind
  tableNumber: number | string
  orderNumber?: string
  time: string
}

const KIND_LINE: Record<GuestServiceKind, string> = {
  waiter: "Customer requests a waiter.",
  bill: "Customer requests the bill.",
}

function formatDisplayTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    })
  } catch {
    return iso
  }
}

/** Structured alert body stored in `table_alerts.message` (staff + workflow). */
export function buildGuestServiceAlertMessage(meta: Omit<GuestServiceAlertMeta, "time"> & { time?: string }): string {
  const time = meta.time ?? new Date().toISOString()
  const lines = [
    KIND_LINE[meta.kind],
    `Table: ${meta.tableNumber}`,
    meta.orderNumber ? `Order: ${meta.orderNumber}` : null,
    `Time: ${formatDisplayTime(time)}`,
  ].filter((line): line is string => Boolean(line))
  return lines.join("\n")
}

export function parseGuestServiceAlertMessage(message: string): GuestServiceAlertMeta | null {
  const lines = message.split("\n").map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  let kind: GuestServiceKind | null = null
  if (lines[0].includes("waiter")) kind = "waiter"
  else if (lines[0].includes("bill")) kind = "bill"

  let tableNumber: string | number = ""
  let orderNumber: string | undefined
  let time = new Date().toISOString()

  for (const line of lines.slice(1)) {
    if (line.startsWith("Table:")) tableNumber = line.replace(/^Table:\s*/, "").trim()
    else if (line.startsWith("Order:")) orderNumber = line.replace(/^Order:\s*/, "").trim()
    else if (line.startsWith("Time:")) time = line.replace(/^Time:\s*/, "").trim()
  }

  if (!kind || tableNumber === "") return null
  return { kind, tableNumber, orderNumber, time }
}

/** Staff bell notification body (always includes required fields). */
export function staffServiceNotificationBody(meta: GuestServiceAlertMeta): string {
  const lines = [
    `Table ${meta.tableNumber}`,
    meta.orderNumber ? `Order ${meta.orderNumber}` : null,
    meta.time,
    KIND_LINE[meta.kind],
  ].filter((line): line is string => Boolean(line))
  return lines.join(" · ")
}
