import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    agent: "customer_journey",
    funnel: [
      { stage: "landing", visitors: 1000, conversionToNext: 0.62, dropReasons: ["bounce menu"] },
      { stage: "menu_view", visitors: 620, conversionToNext: 0.41, dropReasons: ["prix", "charge mobile"] },
      { stage: "cart", visitors: 254, conversionToNext: 0.71, dropReasons: ["frais livraison"] },
      { stage: "checkout", visitors: 180, conversionToNext: 0.88, dropReasons: ["paiement"] },
      { stage: "paid", visitors: 158, conversionToNext: 1, dropReasons: [] },
    ],
    insights: [
      { severity: "high", text: "Perte max entre menu et panier — tester recommandations plus visibles" },
      { severity: "medium", text: "Pic d'abandon checkout vendredi 20h — aligner ETA" },
    ],
    winOpportunities: ["Push ‘comme d’habitude’ pour comptes fideles", "QR table reduit friction de 18%"],
    generatedAt: new Date().toISOString(),
  })
}
