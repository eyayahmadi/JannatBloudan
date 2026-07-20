import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import { isLikelyOrderUuid, shapeGuestOrderResponse } from "@/lib/orders/guest-tracking"
import { type NextRequest, NextResponse } from "next/server"

/** Suivi commande publique (ex. QR) — l’UUID sert déjà de secret peu devinable. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || !isLikelyOrderUuid(id)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 })
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }

    const supabase = createServiceRoleClient()
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        table_id,
        table_number,
        order_type,
        status,
        customer_name,
        total,
        created_at,
        updated_at,
        order_items (
          product_name,
          product_name_ar,
          quantity
        )
      `,
      )
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("[orders/id] GET error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    const items = Array.isArray((order as { order_items?: unknown }).order_items)
      ? (order as { order_items: Array<{ product_name: string; product_name_ar?: string | null; quantity: number | string }> }).order_items
      : []

    const { order_items: _, ...rest } = order as typeof order & { order_items?: unknown }
    return NextResponse.json({ order: shapeGuestOrderResponse(rest, items) })
  } catch (err) {
    console.error("[orders/id] GET exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({ error: "not_configured" }, { status: 503 })
    }

    const body = await request.json()
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from("orders")
      .update({ status: body.status })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error("[orders/id] PATCH exception", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
