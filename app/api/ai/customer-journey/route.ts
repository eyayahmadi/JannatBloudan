import { NextResponse } from "next/server"

export async function GET() {
  const funnel = [
    {
      stage: "landing",
      label: "Entrée",
      visitors: 1000,
      conversionToNext: 0.62,
      dropReasons: [{ reason: "Rebond catalogue", pct: 24 }, { reason: "Temps chargement", pct: 14 }],
      mobileFriction: 18,
      abandonedApprox: 120,
    },
    {
      stage: "menu_view",
      label: "Menu",
      visitors: 620,
      conversionToNext: 0.41,
      dropReasons: [{ reason: "Prix perçus", pct: 32 }, { reason: "UX mobile", pct: 22 }],
      mobileFriction: 34,
      abandonedApprox: 210,
    },
    {
      stage: "cart",
      label: "Panier",
      visitors: 254,
      conversionToNext: 0.71,
      dropReasons: [{ reason: "Frais livraison", pct: 28 }, { reason: "Délai estimé", pct: 18 }],
      mobileFriction: 12,
      abandonedApprox: 45,
    },
    {
      stage: "checkout",
      label: "Paiement",
      visitors: 180,
      conversionToNext: 0.88,
      dropReasons: [{ reason: "Moyen de paiement", pct: 9 }, { reason: "3-D Secure", pct: 3 }],
      mobileFriction: 21,
      abandonedApprox: 22,
    },
    {
      stage: "paid",
      label: "Confirmé",
      visitors: 158,
      conversionToNext: 1,
      dropReasons: [],
      mobileFriction: 0,
      abandonedApprox: 0,
    },
  ]

  const globalConversion = funnel[funnel.length - 1].visitors / Math.max(funnel[0].visitors, 1)

  return NextResponse.json({
    agent: "customer_journey",
    funnel,
    globalConversionRate: Number(globalConversion.toFixed(4)),
    painPoints: ["Friction mobile sur le menu", "Passage menu → panier", "Communication délai / livraison"],
    insights: [
      {
        severity: "high",
        text: "Perte maximale entre menu et panier — renforcer recommandations et preuve sociale.",
      },
      { severity: "medium", text: "Pic d'abandon checkout vendredi 20h — aligner ETA et relances panier." },
    ],
    recoverySuggestions: [
      "Relance panier abandonné à T+45 min avec -5% code flash",
      "Bandeau « Commande en 1 clic » pour comptes identifiés",
      "Paiement Apple / Google Pay en priorité mobile",
    ],
    notificationIdeas: [
      { channel: "Push", text: "Votre panier vous attend — finalisez en deux minutes." },
      { channel: "Email", text: "Les plats consultés partent vite ce soir." },
    ],
    winOpportunities: [
      "Routine « comme d'habitude » pour fidèles",
      "QR table : moins de friction (est. -18 % vs. benchmark)",
    ],
    generatedAt: new Date().toISOString(),
  })
}
