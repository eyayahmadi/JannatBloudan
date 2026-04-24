import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      invoice: { id, status: "validated", source: "memory" },
    })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
    }

    return NextResponse.json({ invoice: data, source: "supabase" })
  } catch (err) {
    console.error("[invoices/:id] GET exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const allowed: Record<string, any> = {}
  if (body.status) allowed.status = body.status
  if (body.payment_method) allowed.payment_method = body.payment_method
  if (body.paid_at) allowed.paid_at = body.paid_at
  if (body.status === "paid" && !body.paid_at)
    allowed.paid_at = new Date().toISOString()
  if (body.notes !== undefined) allowed.notes = body.notes
  if (body.cashier_id) allowed.cashier_id = body.cashier_id

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      invoice: { id, ...allowed, updated_at: new Date().toISOString() },
      source: "memory",
    })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("invoices")
      .update(allowed)
      .eq("id", id)
      .select("*, invoice_items(*)")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
    }

    return NextResponse.json({ invoice: data, source: "supabase" })
  } catch (err) {
    console.error("[invoices/:id] PATCH exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ success: true, source: "memory" })
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("invoices")
      .update({ status: "cancelled" })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, source: "supabase" })
  } catch (err) {
    console.error("[invoices/:id] DELETE exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
