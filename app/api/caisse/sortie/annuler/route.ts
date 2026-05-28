import { NextResponse } from "next/server"
import { createServiceRoleClient, requireAdmin } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

/**
 * Annulation traçable d'une sortie de caisse — jamais de DELETE.
 * Crée une ligne kind=annulation_sortie qui réduit les sorties nettes (argent théorique revient).
 */
export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase requis" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const originalId = typeof body.original_movement_id === "string" ? body.original_movement_id.trim() : ""
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""

  if (!originalId) {
    return NextResponse.json({ error: "original_movement_id requis" }, { status: 400 })
  }
  if (reason.length < 4) {
    return NextResponse.json({ error: "Raison d'annulation requise (min. 4 caractères)" }, { status: 400 })
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: original, error: loadErr } = await supabase
      .from("cash_register_movements")
      .select("id, kind, amount, description, beneficiary_user_id, beneficiary_display_name, beneficiary_role_label, movement_at")
      .eq("id", originalId)
      .maybeSingle()

    if (loadErr || !original) {
      return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 })
    }

    if (String((original as { kind?: string }).kind) !== "sortie_caisse") {
      return NextResponse.json(
        { error: "Seules les sorties de caisse peuvent être annulées par ce flux." },
        { status: 400 },
      )
    }

    const { data: dup } = await supabase
      .from("cash_register_movements")
      .select("id")
      .eq("kind", "annulation_sortie")
      .eq("reverses_movement_id", originalId)
      .maybeSingle()

    if (dup?.id) {
      return NextResponse.json(
        { error: "Ce mouvement a déjà été annulé (trace existante)." },
        { status: 409 },
      )
    }

    const amount = Number((original as { amount?: unknown }).amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Montant du mouvement original invalide" }, { status: 400 })
    }

    const origDesc = String((original as { description?: string }).description ?? "")
    const desc = `ANNULATION sortie ${originalId.slice(0, 8)}… — motif: ${reason}`

    const movementAtIso = new Date().toISOString()

    const { data: inserted, error: insErr } = await supabase
      .from("cash_register_movements")
      .insert({
        kind: "annulation_sortie",
        amount,
        currency: "EUR",
        description: desc,
        attachment_url: null,
        performed_by: guard.user.id,
        validated_by: guard.user.id,
        beneficiary_user_id: (original as { beneficiary_user_id?: string }).beneficiary_user_id ?? null,
        beneficiary_display_name: (original as { beneficiary_display_name?: string }).beneficiary_display_name ?? null,
        beneficiary_role_label: (original as { beneficiary_role_label?: string }).beneficiary_role_label ?? null,
        movement_at: movementAtIso,
        reverses_movement_id: originalId,
        meta: {
          corrected_description_snapshot: origDesc,
          cancelled_by_admin_user_id: guard.user.id,
          cancel_reason: reason,
          cancelled_at_iso: movementAtIso,
          source: "annulation_sortie_api",
        },
      })
      .select("id, kind, amount, movement_at, reverses_movement_id, created_at")
      .single()

    if (insErr) {
      console.error("[sortie annuler]", insErr)
      return NextResponse.json(
        { error: insErr.message, hint: "Exécutez scripts/17-sortie-caisse-trace.sql si colonnes absentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, movement: inserted })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
