import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const dessertOff =
    ctx.rushLevel === "calm"
      ? { label: "Baklava ou Kunafa", discountPercent: 10, reason: "Creux — marge dessert renforcée" }
      : { label: "Thé à la menthe", discountPercent: 0, reason: "Rush — service express" }

  return NextResponse.json({
    agent: "upsell_intelligent",
    contextualMode: ctx.rushLevel,
    adaptationHints: [
      ctx.rushLevel === "rush" ? "Suggestions courtes ; focus boissons prêtes" : "Bundles dessert + café premium",
      "Météo & saison : varier jus / chaud (brancher API météo en prod)",
    ],
    analytics: {
      avgBasketUpliftEUR: 4.2,
      acceptanceRatePercent: 23,
      bestCategory: "dessert",
    },
    suggestions: [
      {
        type: "dessert",
        title: dessertOff.label,
        pitch: `Ajoutez un dessert${dessertOff.discountPercent ? ` avec -${dessertOff.discountPercent}%` : ""} ?`,
        reason: dessertOff.reason,
        emoji: "🍰",
        estimatedConversionPercent: ctx.rushLevel === "calm" ? 22 : 11,
        expectedRevenueIncreaseEUR: ctx.rushLevel === "calm" ? 520 : 180,
        confidenceScore: 0.84,
        bestTiming: "Après validation du plat principal",
      },
      {
        type: "drink",
        title: "Jus d'orange frais",
        pitch: "Une boisson pour accompagner votre plat ?",
        reason: ctx.rushLevel === "rush" ? "Préparation rapide" : "Panier moyen",
        emoji: "🍊",
        estimatedConversionPercent: 18,
        expectedRevenueIncreaseEUR: 340,
        confidenceScore: 0.77,
        bestTiming: "Au moment du choix du plat",
      },
      {
        type: "extra",
        title: "Houmous supplément",
        pitch: "Partager un mezze en plus ?",
        reason: "Meilleur taux de clic le week-end",
        emoji: "🧆",
        estimatedConversionPercent: 14,
        expectedRevenueIncreaseEUR: 210,
        confidenceScore: 0.71,
        bestTiming: "Panier > 18 €",
      },
    ],
    context: ctx,
    algorithm: "context_bandit_v1",
    generatedAt: new Date().toISOString(),
  })
}
