import { NextResponse } from "next/server"

const TIERS = [
  { name: "Bronze", min: 0, max: 200, color: "#CD7F32", perks: ["Acces au menu", "Points de base"] },
  { name: "Silver", min: 200, max: 500, color: "#C0C0C0", perks: ["Cafe offert", "-5% permanent"] },
  { name: "Gold", min: 500, max: 1000, color: "#FFD700", perks: ["Dessert offert", "-10% permanent", "Priorite reservation"] },
  { name: "Platinum", min: 1000, max: 99999, color: "#E5E4E2", perks: ["-15% permanent", "Menu VIP", "Evenements exclusifs", "Livraison gratuite"] },
]

const CHALLENGES = [
  { id: "ch1", title: "Commander 3 fois cette semaine", reward: 50, progress: 2, target: 3, active: true },
  { id: "ch2", title: "Essayer 5 categories differentes", reward: 100, progress: 3, target: 5, active: true },
  { id: "ch3", title: "Depenser 50 EUR en une commande", reward: 30, progress: 0, target: 1, active: true },
  { id: "ch4", title: "Partager un avis", reward: 20, progress: 0, target: 1, active: true },
  { id: "ch5", title: "Commander un nouveau plat", reward: 25, progress: 1, target: 1, active: false },
]

const ACHIEVEMENTS = [
  { id: "ach1", title: "Premiere commande", icon: "star", unlocked: true, date: "2024-06-15" },
  { id: "ach2", title: "10 commandes", icon: "trophy", unlocked: true, date: "2024-09-20" },
  { id: "ach3", title: "Toutes les categories", icon: "grid", unlocked: false, date: null },
  { id: "ach4", title: "Client nocturne", icon: "moon", unlocked: true, date: "2024-11-01" },
  { id: "ach5", title: "50 commandes", icon: "crown", unlocked: false, date: null },
  { id: "ach6", title: "Ambassadeur", icon: "heart", unlocked: false, date: null },
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const points = body.points ?? 450
    const totalSpent = body.totalSpent ?? 450

    const currentTier = TIERS.find((t) => points >= t.min && points < t.max) || TIERS[0]
    const nextTier = TIERS[TIERS.indexOf(currentTier) + 1] || null
    const progress = nextTier ? Math.round(((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100

    return NextResponse.json({
      tier: { ...currentTier, progress },
      nextTier,
      points,
      pointsToNextTier: nextTier ? nextTier.min - points : 0,
      challenges: CHALLENGES,
      achievements: ACHIEVEMENTS,
      leaderboard: [
        { rank: 1, name: "Amina K.", points: 1250, tier: "Platinum" },
        { rank: 2, name: "Mohamed R.", points: 890, tier: "Gold" },
        { rank: 3, name: "Sarah L.", points: 720, tier: "Gold" },
        { rank: 4, name: "Vous", points, tier: currentTier.name },
        { rank: 5, name: "Ali M.", points: 380, tier: "Silver" },
      ],
      algorithm: "gamified_loyalty_v1",
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
