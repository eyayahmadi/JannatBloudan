import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const ingredientId: string | undefined = body.ingredientId ?? body.productId
    const adjustment: number = Number(body.adjustment)
    const reason: string = body.reason || "Ajustement manuel"
    const movementType: string =
      body.movementType ?? (adjustment >= 0 ? "in" : "out")
    const unitCost: number | null = body.unitCost ?? null
    const performedBy: string | null = body.performedBy ?? null

    if (!ingredientId || Number.isNaN(adjustment)) {
      return NextResponse.json(
        { error: "ingredientId et adjustment (number) requis" },
        { status: 400 },
      )
    }

    if (!hasServerSupabaseEnv()) {
      return NextResponse.json({
        success: true,
        source: "mock",
        ingredientId,
        adjustment,
        reason,
        timestamp: new Date().toISOString(),
      })
    }

    const supabase = await createClient()

    // 1. Enregistrer le mouvement (historique)
    const { error: moveErr } = await supabase.from("stock_movements").insert({
      ingredient_id: ingredientId,
      movement_type: movementType,
      quantity: Math.abs(adjustment),
      unit_cost: unitCost,
      reason,
      performed_by: performedBy,
      reference_type: "manual",
    })

    if (moveErr) {
      console.error("[stock/adjust] insert movement error", moveErr)
      return NextResponse.json({ error: moveErr.message }, { status: 500 })
    }

    // 2. Ajuster le stock directement
    const { data: ing, error: ingErr } = await supabase
      .from("ingredients")
      .select("id, stock_quantity")
      .eq("id", ingredientId)
      .maybeSingle()

    if (ingErr || !ing) {
      return NextResponse.json(
        { error: ingErr?.message ?? "Ingredient introuvable" },
        { status: 404 },
      )
    }

    const newStock = Number(ing.stock_quantity) + adjustment
    const { error: updErr } = await supabase
      .from("ingredients")
      .update({
        stock_quantity: Math.max(0, newStock),
        last_restocked_at: adjustment > 0 ? new Date().toISOString() : undefined,
      })
      .eq("id", ingredientId)

    if (updErr) {
      console.error("[stock/adjust] update ingredient error", updErr)
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      source: "supabase",
      ingredientId,
      adjustment,
      newStock: Math.max(0, newStock),
      reason,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error("[stock/adjust] exception", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
