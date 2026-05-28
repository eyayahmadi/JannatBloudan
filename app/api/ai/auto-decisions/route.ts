import { NextResponse } from "next/server"

import { getRestaurantOperationalContext } from "@/lib/agent-context/context"

export async function GET() {
  const ctx = getRestaurantOperationalContext()
  const govThreshold = 500

  const decisions = [
    {
      id: "d1",
      type: "promo",
      title: "Happy hour boissons",
      auto: true,
      reason: ctx.rushLevel === "calm" ? "Stimuler le panier en creux" : "Désactivé — période de rush",
      active: ctx.rushLevel !== "rush",
      priority: "high" as const,
      risk: "low" as const,
      confidence: 0.89,
      impactEUR: 320,
      humanApprovalRequired: false,
    },
    {
      id: "d2",
      type: "pricing",
      title: "Ajustement dynamique shawarma +3%",
      auto: true,
      reason: "Demande élevée + stock poulet confortable",
      active: ctx.loadIndex > 55,
      priority: "medium" as const,
      risk: "medium" as const,
      confidence: 0.76,
      impactEUR: 640,
      humanApprovalRequired: true,
    },
    {
      id: "d3",
      type: "stock",
      title: "Pré-commande fournisseur pistaches",
      auto: true,
      reason: "Prévision rupture J+3 sur ingrédient critique",
      active: true,
      priority: "high" as const,
      risk: "low" as const,
      confidence: 0.82,
      impactEUR: 890,
      humanApprovalRequired: true,
    },
  ].map((d) => ({
    ...d,
    humanApprovalRequired: d.humanApprovalRequired || d.impactEUR >= govThreshold,
  }))

  return NextResponse.json({
    agent: "auto_decision_maker",
    governance: {
      humanApprovalRequiredAboveEUR: govThreshold,
      auditLog: "enabled",
      mode: ctx.rushLevel === "rush" ? "conservative" : "balanced",
    },
    decisions,
    context: ctx,
    notifications: [
      { id: "n1", level: "info", text: "Journal d'audit synchronisé (démo)" },
      {
        id: "n2",
        level: ctx.loadIndex > 70 ? "warning" : "success",
        text:
          ctx.loadIndex > 70
            ? "Charge cuisine élevée — décisions prix sous surveillance"
            : "Paramètres de risque dans les clous",
      },
    ],
    generatedAt: new Date().toISOString(),
  })
}
