import { NextResponse } from "next/server"
import { requireRoles } from "@/lib/auth/admin-api"
import type { KitchenOrder } from "@/lib/hooks/useRealtimeOrders"
import {
  buildStationTicketHTML,
  TICKET_LAYOUT_VERSION,
  type PrintOptions,
} from "@/lib/print/kitchen-ticket"
import { SITE } from "@/lib/site-config"
import type { Station } from "@/lib/stations/config"

const ROLES = ["ADMIN", "KITCHEN", "BAR", "SHISHA"] as const

type PrintTicketBody = {
  order?: KitchenOrder
  restaurantName?: string
  locale?: PrintOptions["locale"]
  station?: Station
  title?: string
}

/** Server-side ticket HTML — always uses latest layout (no client bundle cache). */
export async function POST(request: Request) {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response

  let body: PrintTicketBody
  try {
    body = (await request.json()) as PrintTicketBody
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 })
  }

  const order = body.order
  if (!order?.order_number || !Array.isArray(order.items)) {
    return NextResponse.json({ error: "order requis" }, { status: 400 })
  }

  const html = buildStationTicketHTML(order, {
    restaurantName: body.restaurantName ?? SITE.name,
    locale: body.locale ?? "de",
    station: body.station,
    title: body.title,
  })

  return NextResponse.json(
    { html, layoutVersion: TICKET_LAYOUT_VERSION },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  )
}
