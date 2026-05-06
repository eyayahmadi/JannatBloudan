import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const STAFF_ALLOWED = ["ADMIN", "CASHIER"] as const

type MovementKind = "sortie_caisse" | "avance_client" | "ajustement" | "avance_salaire"

/**
 * Liste des mouvements de caisse (sorties / avances / ajustements).
 * Nécessite migration `scripts/13-cash-register-movements.sql`.
 */
export async function GET() {
  const guard = await requireRoles(STAFF_ALLOWED)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ movements: [], disabled: true, reason: "supabase_env" })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("cash_register_movements")
      .select(
        "id, kind, amount, currency, description, attachment_url, validated_by, beneficiary_user_id, performed_by, meta, linked_expense_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(80)

    if (error) {
      console.error("[cash-register-movements GET]", error)
      return NextResponse.json(
        { movements: [], error: error.message, hint: "Exécuter scripts/13-cash-register-movements.sql" },
        { status: 200 },
      )
    }

    const sortie = (data ?? []).filter((r) => r.kind === "sortie_caisse").reduce((s, r) => s + Number(r.amount), 0)
    const avances = (data ?? []).filter((r) => r.kind === "avance_client").reduce((s, r) => s + Number(r.amount), 0)

    return NextResponse.json({
      movements: data ?? [],
      totals: {
        dernieres_sorties_sum: sortie,
        dernieres_avances_sum: avances,
        count: data?.length ?? 0,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ movements: [], error: String(e) }, { status: 500 })
  }
}

/**
 * Enregistrer une sortie de caisse, une avance client ou un ajustement (journal + audit utilisateur).
 */
export async function POST(request: Request) {
  const guard = await requireRoles(STAFF_ALLOWED)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const kind = body.kind as MovementKind | undefined
  const amount = Number(body.amount)
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const attachment_url = typeof body.attachment_url === "string" ? body.attachment_url.trim() || null : null

  if (!kind || !["sortie_caisse", "avance_client", "ajustement", "avance_salaire"].includes(kind)) {
    return NextResponse.json({ error: "kind invalide" }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "montant invalide" }, { status: 400 })
  }
  if (!description) {
    return NextResponse.json({ error: "description requise" }, { status: 400 })
  }

  const beneficiary_user_id =
    typeof body.beneficiary_user_id === "string" && body.beneficiary_user_id.length > 0
      ? body.beneficiary_user_id
      : null
  const createExpense = Boolean(body.create_finance_expense) && kind === "sortie_caisse"

  try {
    const supabase = createServiceRoleClient()
    const metaRoot =
      typeof body.meta === "object" && body.meta !== null
        ? (body.meta as Record<string, unknown>)
        : { logged_role: guard.role, source: "pos_or_api" }

    const { data: inserted, error } = await supabase
      .from("cash_register_movements")
      .insert({
        kind,
        amount,
        currency: "EUR",
        description,
        attachment_url,
        performed_by: guard.user.id,
        validated_by: guard.user.id,
        beneficiary_user_id,
        meta: { ...metaRoot, validated_role: guard.role },
      })
      .select(
        "id, kind, amount, currency, description, beneficiary_user_id, validated_by, performed_by, created_at",
      )
      .single()

    if (error) {
      console.error("[cash-register-movements POST]", error)
      return NextResponse.json(
        { error: error.message, hint: "Colonnes beneficiary/validated nécessitent migration 14." },
        { status: 500 },
      )
    }

    let expense_id: string | null = null
    if (createExpense && inserted?.id) {
      const today = new Date().toISOString().slice(0, 10)
      const cat = await supabase.from("expense_categories").select("id").limit(1).maybeSingle()
      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .insert({
          category_id: cat.data?.id ?? null,
          label: description.slice(0, 190),
          amount,
          currency: "EUR",
          expense_date: today,
          payment_method: "cash",
          notes: `sortie caisse mouvement ${inserted.id}`,
          recorded_by: guard.user.id,
          cash_movement_id: inserted.id,
        })
        .select("id")
        .single()

      if (!expErr && exp?.id) {
        expense_id = String(exp.id)
        await supabase.from("cash_register_movements").update({ linked_expense_id: exp.id }).eq("id", inserted.id)
      }
    }

    return NextResponse.json({ success: true, movement: inserted, expense_id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
