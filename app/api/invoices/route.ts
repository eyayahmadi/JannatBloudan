import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type InvoiceInput = {
  orderId?: string | null
  sessionId?: string | null
  customerId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  items?: Array<{
    productId?: string | null
    productName: string
    quantity: number
    unitPrice: number
    notes?: string | null
  }>
  subtotal?: number
  tvaRate?: number
  discountAmount?: number
  total?: number
  paymentMethod?: string
  cashierId?: string | null
  notes?: string | null
  status?: "draft" | "validated" | "paid" | "cancelled" | "refunded"
}

// Fallback en memoire (utilise si Supabase indisponible)
const memoryInvoices: any[] = []

function generateInvoiceId() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const seq = String(d.getTime()).slice(-6)
  return `INV-${y}${m}${day}-${seq}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = Number(searchParams.get("limit") || 50)

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({
      invoices: memoryInvoices.slice(-limit).reverse(),
      source: "memory",
    })
  }

  try {
    const supabase = await createClient()
    let query = supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status) query = query.eq("status", status)

    const { data, error } = await query
    if (error) {
      console.error("[invoices] GET error", error)
      return NextResponse.json({
        invoices: memoryInvoices.slice(-limit).reverse(),
        source: "memory",
        warning: error.message,
      })
    }

    return NextResponse.json({ invoices: data ?? [], source: "supabase" })
  } catch (err) {
    console.error("[invoices] GET exception", err)
    return NextResponse.json({
      invoices: memoryInvoices.slice(-limit).reverse(),
      source: "memory-fallback",
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InvoiceInput
    const items = body.items ?? []

    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)

    const tvaRate = typeof body.tvaRate === "number" ? body.tvaRate : 0.19
    const discountAmount = body.discountAmount ?? 0
    const tvaAmount = subtotal * tvaRate
    const total =
      typeof body.total === "number" ? body.total : subtotal + tvaAmount - discountAmount

    const id = generateInvoiceId()
    const base = {
      id,
      order_id: body.orderId ?? null,
      session_id: body.sessionId ?? null,
      customer_id: body.customerId ?? null,
      customer_name: body.customerName ?? "Client",
      customer_email: body.customerEmail ?? null,
      customer_phone: body.customerPhone ?? null,
      subtotal,
      tva_rate: tvaRate,
      tva_amount: tvaAmount,
      discount_amount: discountAmount,
      total,
      status: body.status ?? "validated",
      payment_method: body.paymentMethod ?? "card",
      cashier_id: body.cashierId ?? null,
      notes: body.notes ?? null,
      paid_at: body.status === "paid" ? new Date().toISOString() : null,
    }

    if (!hasServerSupabaseEnv()) {
      const invoice = {
        ...base,
        items,
        created_at: new Date().toISOString(),
      }
      memoryInvoices.push(invoice)
      return NextResponse.json({ invoice, source: "memory" }, { status: 201 })
    }

    const supabase = await createClient()
    const { data: inv, error } = await supabase
      .from("invoices")
      .insert(base)
      .select("*")
      .single()

    if (error || !inv) {
      console.error("[invoices] POST error", error)
      const fallback = { ...base, items, created_at: new Date().toISOString() }
      memoryInvoices.push(fallback)
      return NextResponse.json(
        { invoice: fallback, source: "memory-fallback", warning: error?.message },
        { status: 201 },
      )
    }

    if (items.length > 0) {
      const rows = items.map((it) => ({
        invoice_id: id,
        product_id: it.productId ?? null,
        product_name: it.productName,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        subtotal: it.quantity * it.unitPrice,
        notes: it.notes ?? null,
      }))
      const { error: itemsErr } = await supabase.from("invoice_items").insert(rows)
      if (itemsErr) console.error("[invoices] items error", itemsErr)
    }

    return NextResponse.json(
      { invoice: { ...inv, items }, source: "supabase" },
      { status: 201 },
    )
  } catch (err) {
    console.error("[invoices] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
