import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const dessertOff =
    ctx.rushLevel === "calm"
      ? { label: "Baklava ou Kunafa", discountPercent: 10, reason: "Creux — marge dessert" }
      : { label: "The a la Menthe", discountPercent: 0, reason: "Rush — boisson rapide" }

  return NextResponse.json({
    agent: "upsell_intelligent",
    suggestions: [
      {
        type: "dessert",
        title: dessertOff.label,
        pitch: `Ajoutez un dessert avec -${dessertOff.discountPercent}% ce soir ?`,
        reason: dessertOff.reason,
      },
      {
        type: "drink",
        title: "Jus d'orange frais",
        pitch: "Une boisson pour accompagner votre plat ?",
        reason: ctx.rushLevel === "rush" ? "Service express" : "Panier moyen",
      },
      {
        type: "extra",
        title: "Houmous supplement",
        pitch: "Partager un mezze en plus ?",
        reason: "Taux de clic eleve le week-end",
      },
    ],
    context: ctx,
    algorithm: "context_bandit_v1",
    generatedAt: new Date().toISOString(),
  })
}
