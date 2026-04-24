import { NextResponse } from "next/server"

type Campaign = {
  id: string
  name: string
  targetSegment: string
  message: string
  channel: "sms" | "email" | "push"
  discount: number
  timing: string
  estimatedReach: number
  estimatedRevenue: number
  status: "draft" | "scheduled" | "sent"
}

const SEGMENTS = [
  { name: "Clients inactifs", count: 234, description: "Pas de commande depuis 7+ jours" },
  { name: "Clients fideles", count: 156, description: "5+ commandes le mois dernier" },
  { name: "Nouveaux clients", count: 89, description: "Premiere commande ce mois" },
  { name: "Gros paniers", count: 67, description: "Panier moyen > 30 EUR" },
  { name: "Fans desserts", count: 112, description: "2+ desserts par commande" },
]

function generateCampaigns(): Campaign[] {
  const hour = new Date().getHours()
  const campaigns: Campaign[] = [
    {
      id: "CMP-001",
      name: "Win-back clients inactifs",
      targetSegment: "Clients inactifs",
      message: "Vous nous manquez ! -20% sur votre prochaine commande avec le code REVIENS20",
      channel: "email",
      discount: 20,
      timing: "Immediat",
      estimatedReach: 234,
      estimatedRevenue: 1872,
      status: "draft",
    },
    {
      id: "CMP-002",
      name: "Recompense fidelite",
      targetSegment: "Clients fideles",
      message: "Merci pour votre fidelite ! Dessert offert sur votre prochaine commande.",
      channel: "push",
      discount: 0,
      timing: "Immediat",
      estimatedReach: 156,
      estimatedRevenue: 1248,
      status: "draft",
    },
    {
      id: "CMP-003",
      name: "Bienvenue nouveaux clients",
      targetSegment: "Nouveaux clients",
      message: "Bienvenue chez Jannat Baloudan ! -15% sur votre 2eme commande.",
      channel: "sms",
      discount: 15,
      timing: "24h apres inscription",
      estimatedReach: 89,
      estimatedRevenue: 534,
      status: "scheduled",
    },
  ]

  if (hour >= 11 && hour < 13) {
    campaigns.push({
      id: "CMP-004",
      name: "Push dejeuner",
      targetSegment: "Tous les clients",
      message: "C'est l'heure du dejeuner ! Menu midi a partir de 9.90 EUR.",
      channel: "push",
      discount: 0,
      timing: "11h-13h",
      estimatedReach: 546,
      estimatedRevenue: 3276,
      status: "sent",
    })
  }

  if (hour >= 17 && hour < 20) {
    campaigns.push({
      id: "CMP-005",
      name: "Push diner",
      targetSegment: "Tous les clients",
      message: "Ce soir, grillades et mezzes vous attendent. Reservez ou commandez !",
      channel: "push",
      discount: 0,
      timing: "17h-20h",
      estimatedReach: 546,
      estimatedRevenue: 4368,
      status: "sent",
    })
  }

  return campaigns
}

export async function GET() {
  return NextResponse.json({
    campaigns: generateCampaigns(),
    segments: SEGMENTS,
    summary: {
      totalSegments: SEGMENTS.length,
      totalReachable: SEGMENTS.reduce((s, seg) => s + seg.count, 0),
      activeCampaigns: generateCampaigns().filter((c) => c.status === "sent").length,
    },
    algorithm: "segment_based_campaign_generator_v1",
  })
}
