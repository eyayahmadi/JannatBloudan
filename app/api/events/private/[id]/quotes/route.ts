import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ quotes: [], source: "mock" })
  }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("event_quotes")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quotes: data ?? [], source: "supabase" })
  } catch (err) {
    console.error("[events/private/:id/quotes] GET exception", err)
    return NextResponse.json({ quotes: [], source: "mock-fallback" })
  }
}

export async function POST(request: Request, { params }: Params) {
  const { id: requestId } = await params
  try {
    const body = await request.json()
    const lineItems: any[] = Array.isArray(body.lineItems) ? body.lineItems : []
    const subtotal: number =
      typeof body.subtotal === "number"
        ? body.subtotal
        : lineItems.reduce((s, it) => {
            const line =
              typeof it.subtotal === "number"
                ? it.subtotal
                : Number(it.qty ?? 0) * Number(it.unit_price ?? 0)
            return s + line
          }, 0)
    const tvaRate = typeof body.tvaRate === "number" ? body.tvaRate : 0.19
    const discountAmount = body.discountAmount ?? 0
    const tvaAmount = subtotal * tvaRate
    const total =
      typeof body.total === "number"
        ? body.total
        : subtotal + tvaAmount - discountAmount

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({
        quote: {
          id: `DEV-LOCAL-${Date.now()}`,
          request_id: requestId,
          line_items: lineItems,
          subtotal,
          tva_rate: tvaRate,
          tva_amount: tvaAmount,
          discount_amount: discountAmount,
          total,
          status: "draft",
          created_at: new Date().toISOString(),
        },
        source: "mock",
      })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("event_quotes")
      .insert({
        request_id: requestId,
        line_items: lineItems,
        subtotal,
        tva_rate: tvaRate,
        tva_amount: tvaAmount,
        discount_amount: discountAmount,
        total,
        deposit_amount: body.depositAmount ?? Math.round(total * 0.3 * 100) / 100,
        valid_until: body.validUntil ?? null,
        notes: body.notes ?? null,
        status: body.status ?? "sent",
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Remonte le statut de la demande a "reviewing" si elle etait "pending"
    await supabase
      .from("event_requests")
      .update({ status: "reviewing" })
      .eq("id", requestId)
      .eq("status", "pending")

    return NextResponse.json({ quote: data, source: "supabase" }, { status: 201 })
  } catch (err) {
    console.error("[events/private/:id/quotes] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
