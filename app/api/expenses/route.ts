import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // YYYY-MM
  const categoryId = searchParams.get("categoryId")
  const limit = Number(searchParams.get("limit") || 100)

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ expenses: [], categories: [], source: "mock" })
  }

  try {
    const supabase = await createClient()

    let query = supabase
      .from("expenses")
      .select("*, category:expense_categories(id,name,color)")
      .order("expense_date", { ascending: false })
      .limit(limit)

    if (month) {
      const start = `${month}-01`
      const [year, mo] = month.split("-").map(Number)
      const endDate = new Date(Date.UTC(year, mo, 0)).toISOString().slice(0, 10)
      query = query.gte("expense_date", start).lte("expense_date", endDate)
    }
    if (categoryId) query = query.eq("category_id", categoryId)

    const { data: expenses, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: categories } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("active", true)
      .order("name")

    return NextResponse.json({
      expenses: expenses ?? [],
      categories: categories ?? [],
      source: "supabase",
    })
  } catch (err) {
    console.error("[expenses] GET exception", err)
    return NextResponse.json({ expenses: [], categories: [], source: "mock-fallback" })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.label || typeof body.amount !== "number") {
      return NextResponse.json(
        { error: "label et amount (number) requis" },
        { status: 400 },
      )
    }

    const payload = {
      category_id: body.categoryId ?? null,
      label: body.label,
      amount: body.amount,
      currency: body.currency ?? "EUR",
      expense_date: body.expenseDate ?? new Date().toISOString().slice(0, 10),
      payment_method: body.paymentMethod ?? null,
      vendor: body.vendor ?? null,
      invoice_ref: body.invoiceRef ?? null,
      invoice_url: body.invoiceUrl ?? null,
      recurring: body.recurring ?? false,
      frequency: body.frequency ?? null,
      notes: body.notes ?? null,
      recorded_by: body.recordedBy ?? null,
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json(
        {
          expense: { id: `EXP-LOCAL-${Date.now()}`, ...payload, created_at: new Date().toISOString() },
          source: "mock",
        },
        { status: 201 },
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select("*, category:expense_categories(id,name,color)")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ expense: data, source: "supabase" }, { status: 201 })
  } catch (err) {
    console.error("[expenses] POST exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
