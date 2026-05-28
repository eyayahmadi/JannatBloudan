import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const STAFF_ALLOWED = ["ADMIN", "CASHIER"] as const

type MovementKind = "sortie_caisse" | "avance_client" | "ajustement" | "avance_salaire" | "annulation_sortie"

type CashMovementRow = Record<string, unknown> & {
  id: string
  kind: string
  amount: number | string
  performed_by?: string | null
  validated_by?: string | null
  beneficiary_user_id?: string | null
}

type UserProfileMini = {
  id: string
  full_name?: string | null
  email?: string | null
  role?: string | null
}

type MovementWithProfiles = CashMovementRow & {
  performed_by_profile: UserProfileMini | null
  validated_by_profile: UserProfileMini | null
  beneficiary_user_profile: UserProfileMini | null
}

/**
 * Liste des mouvements de caisse (sorties / avances / ajustements).
 * Query: ?date=YYYY-MM-DD — filtre sur movement_at si colonne présente ; ?expand=users — enrichit noms.
 * Nécessite migrations scripts 13 + 17.
 */
export async function GET(request: Request) {
  const guard = await requireRoles(STAFF_ALLOWED)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ movements: [], disabled: true, reason: "supabase_env" })
  }

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")?.slice(0, 10)
    const expand = searchParams.get("expand") === "users"
    const limit = Math.min(500, Math.max(10, Number(searchParams.get("limit")) || 80))
    const kindsParam = searchParams.get("kinds")
    const kinds = kindsParam
      ? kindsParam.split(",").map((k) => k.trim()).filter(Boolean)
      : null

    const supabase = createServiceRoleClient()

    let q = supabase
      .from("cash_register_movements")
      .select(
        [
          "id",
          "kind",
          "amount",
          "currency",
          "description",
          "attachment_url",
          "validated_by",
          "beneficiary_user_id",
          "beneficiary_display_name",
          "beneficiary_role_label",
          "movement_at",
          "reverses_movement_id",
          "performed_by",
          "meta",
          "linked_expense_id",
          "created_at",
        ].join(","),
      )
      .order("movement_at", { ascending: false })
      .limit(limit)

    const allowedKinds = new Set([
      "sortie_caisse",
      "annulation_sortie",
      "avance_client",
      "ajustement",
      "avance_salaire",
    ])
    const kindFilter = kinds?.length ? kinds.filter((k) => allowedKinds.has(k)) : null
    if (kindFilter?.length) {
      q = q.in("kind", kindFilter)
    }

    if (date?.length === 10) {
      const start = `${date}T00:00:00`
      const endIso = `${date}T23:59:59.999Z`
      q = q.gte("movement_at", start).lte("movement_at", endIso)
    }

    const { data, error } = await q

    if (error) {
      console.error("[cash-register-movements GET]", error)
      return NextResponse.json(
        {
          movements: [],
          error: error.message,
          hint: "Exécutez scripts/13 puis 17-sortie-caisse-trace.sql si colonnes manquantes.",
        },
        { status: 200 },
      )
    }

    const rows: CashMovementRow[] = Array.isArray(data) ? ((data as unknown) as CashMovementRow[]) : []

    let movementsOut: CashMovementRow[] | MovementWithProfiles[] = rows
    const userLookup: Record<string, UserProfileMini> = {}
    if (expand && rows.length) {
      const ids = new Set<string>()
      for (const r of rows) {
        const row = r as { performed_by?: string | null; validated_by?: string | null; beneficiary_user_id?: string | null }
        if (row.performed_by) ids.add(row.performed_by)
        if (row.validated_by) ids.add(row.validated_by)
        if (row.beneficiary_user_id) ids.add(row.beneficiary_user_id)
      }
      if (ids.size) {
        const { data: urows } = await supabase.from("users").select("id, full_name, email, role").in("id", [...ids])
        for (const u of urows ?? []) {
          const id = String((u as { id: string }).id)
          userLookup[id] = u as UserProfileMini
        }
      }
      movementsOut = rows.map(
        (row): MovementWithProfiles => ({
          ...row,
          performed_by_profile: row.performed_by ? userLookup[row.performed_by] ?? null : null,
          validated_by_profile: row.validated_by ? userLookup[row.validated_by] ?? null : null,
          beneficiary_user_profile: row.beneficiary_user_id
            ? userLookup[row.beneficiary_user_id] ?? null
            : null,
        }),
      )
    }

    const sortie = rows.filter((r) => r.kind === "sortie_caisse").reduce((s, r) => s + Number(r.amount), 0)
    const sortieNet =
      rows
        .filter((r) => r.kind === "sortie_caisse" || r.kind === "annulation_sortie")
        .reduce((s, r) => {
          const a = Number(r.amount ?? 0)
          return s + (r.kind === "sortie_caisse" ? a : -a)
        }, 0)
    const avances = rows.filter((r) => r.kind === "avance_client").reduce((s, r) => s + Number(r.amount), 0)

    return NextResponse.json({
      movements: movementsOut,
      totals: {
        dernieres_sorties_brut_sum: Math.round(sortie * 100) / 100,
        dernieres_sorties_net_sum: Math.round(sortieNet * 100) / 100,
        dernieres_avances_sum: avances,
        count: rows.length,
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

  if (kind === "annulation_sortie") {
    return NextResponse.json(
      { error: "Utiliser POST /api/caisse/sortie/annuler (admin) pour une annulation traçable." },
      { status: 400 },
    )
  }
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

  let beneficiary_display_name =
    typeof body.beneficiary_display_name === "string" ? body.beneficiary_display_name.trim() || null : null
  let beneficiary_role_label =
    typeof body.beneficiary_role_label === "string" ? body.beneficiary_role_label.trim() || null : null

  let movement_at: string =
    typeof body.movement_at === "string" && body.movement_at.length >= 10
      ? body.movement_at
      : new Date().toISOString()

  if (kind === "sortie_caisse") {
    if (!beneficiary_display_name?.length && !beneficiary_user_id) {
      return NextResponse.json(
        { error: "Indiquez la personne (nom ou employé relié)." },
        { status: 400 },
      )
    }
    try {
      const d = new Date(movement_at)
      if (!Number.isFinite(d.getTime())) movement_at = new Date().toISOString()
      else movement_at = d.toISOString()
    } catch {
      movement_at = new Date().toISOString()
    }
  }

  const createExpense = Boolean(body.create_finance_expense) && kind === "sortie_caisse"

  try {
    const supabase = createServiceRoleClient()
    const metaRoot =
      typeof body.meta === "object" && body.meta !== null
        ? (body.meta as Record<string, unknown>)
        : { logged_role: guard.role, source: "pos_or_api" }

    const expenseDate = movement_at.slice(0, 10)

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
        beneficiary_display_name,
        beneficiary_role_label,
        movement_at,
        reverses_movement_id: null,
        meta: { ...metaRoot, validated_role: guard.role, recorded_by_user_email: guard.user.email ?? undefined },
      })
      .select(
        [
          "id",
          "kind",
          "amount",
          "currency",
          "description",
          "beneficiary_user_id",
          "beneficiary_display_name",
          "beneficiary_role_label",
          "movement_at",
          "validated_by",
          "performed_by",
          "created_at",
        ].join(","),
      )
      .single()

    if (error) {
      console.error("[cash-register-movements POST]", error)
      return NextResponse.json(
        { error: error.message, hint: "Migrations 14 (validated/beneficiary) et 17 (movement_at, annulation)." },
        { status: 500 },
      )
    }

    const movementRow = (inserted as unknown) as { id: string } | null

    let expense_id: string | null = null
    if (createExpense && movementRow?.id) {
      const ins = movementRow
      const cat = await supabase.from("expense_categories").select("id").limit(1).maybeSingle()
      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .insert({
          category_id: cat.data?.id ?? null,
          label: description.slice(0, 190),
          amount,
          currency: "EUR",
          expense_date: expenseDate,
          payment_method: "cash",
          notes: `sortie caisse mouvement ${ins.id}`,
          recorded_by: guard.user.id,
          cash_movement_id: ins.id,
        })
        .select("id")
        .single()

      if (!expErr && exp && typeof exp === "object" && "id" in exp && exp.id) {
        const expRecord = exp as { id: string }
        expense_id = String(expRecord.id)
        await supabase.from("cash_register_movements").update({ linked_expense_id: expRecord.id }).eq("id", ins.id)
      }
    }

    return NextResponse.json({ success: true, movement: inserted, expense_id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
