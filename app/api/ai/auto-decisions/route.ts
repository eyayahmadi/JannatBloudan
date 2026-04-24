import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const decisions = [
    {
      id: "d1",
      type: "promo",
      title: "Happy hour boissons",
      auto: true,
      reason: ctx.rushLevel === "calm" ? "Stimuler le panier en creux" : "Desactiver — rush",
      active: ctx.rushLevel !== "rush",
    },
    {
      id: "d2",
      type: "pricing",
      title: "Ajustement dynamique shawarma +3%",
      auto: true,
      reason: "Demande elevee + stock poulet OK",
      active: ctx.loadIndex > 55,
    },
    {
      id: "d3",
      type: "stock",
      title: "Pre-commande fournisseur pistaches",
      auto: true,
      reason: "Prevision rupture J+3",
      active: true,
    },
  ]

  return NextResponse.json({
    agent: "auto_decision_maker",
    governance: { humanApprovalRequiredAbove: 500, auditLog: "enabled" },
    decisions,
    context: ctx,
    generatedAt: new Date().toISOString(),
  })
}
