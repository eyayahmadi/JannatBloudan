import { NextResponse } from "next/server"

import { getTicket, updateTicket } from "@/lib/events/tickets-store"

type Params = { params: Promise<{ code: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { code } = await params
  const ticket = await getTicket(code.trim())
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
  return NextResponse.json({ ticket })
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { code } = await params
    const body = (await request.json()) as { action?: "check_in" | "pay" | "cancel" }
    const action = body.action
    const patch =
      action === "check_in"
        ? { status: "checked_in" as const, checkedInAt: new Date().toISOString() }
        : action === "pay"
          ? { status: "paid" as const, paid: true }
          : action === "cancel"
            ? { status: "cancelled" as const }
            : null
    if (!patch) return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
    const ticket = await updateTicket(code.trim(), patch)
    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
    return NextResponse.json({ ticket })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
