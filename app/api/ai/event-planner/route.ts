import { NextResponse } from "next/server"

import { chatCompletion, isLlmConfigured } from "@/lib/llm/chat"

type EventType = "birthday" | "wedding" | "corporate" | "private" | "karaoke" | "buffet"

type Req = {
  type?: EventType | string
  guests?: number
  budget?: number
  date?: string
  preferences?: string
}

const TYPE_LABEL: Record<string, string> = {
  birthday: "Anniversaire",
  wedding: "Mariage",
  corporate: "Entreprise",
  private: "Prive",
  karaoke: "Karaoke",
  buffet: "Buffet",
}

function suggestMenuByType(type: string, guests: number) {
  const perHead = 20 + Math.round(guests / 20) // effet d'echelle
  if (type === "wedding") {
    return {
      style: "Buffet chaud + froid + pieces montees",
      items: [
        "Mezze assortis (houmous, mouhammara, baba ghanoush)",
        "Plat signature: Kebab Halabi ou Grillades mixtes",
        "Riz aux epices + legumes rotis",
        "Kunafa + Baklava + fruits frais",
      ],
      estimatedPricePerHead: perHead + 20,
    }
  }
  if (type === "birthday") {
    return {
      style: "Menu a 3 services + gateau",
      items: [
        "Mezze froids (houmous, taboule, moutabal)",
        "Shawarma poulet + kibbeh + falafel",
        "Gateau personnalise + kunafa",
      ],
      estimatedPricePerHead: perHead,
    }
  }
  if (type === "corporate") {
    return {
      style: "Plateaux + boissons",
      items: [
        "Plateaux mezze partage",
        "Manakish varies (zaatar, fromage, viande)",
        "Brochettes poulet + boissons fraiches",
      ],
      estimatedPricePerHead: perHead - 4,
    }
  }
  if (type === "buffet" || type === "karaoke") {
    return {
      style: "Buffet a volonte",
      items: ["Mezze illimites", "Shawarma + grillades", "Desserts levantins"],
      estimatedPricePerHead: Math.max(12, perHead - 6),
    }
  }
  return {
    style: "Menu personnalise",
    items: ["Selection chef sur mesure"],
    estimatedPricePerHead: perHead,
  }
}

function suggestDecor(type: string, budgetBucket: "low" | "mid" | "high") {
  if (type === "wedding") {
    return budgetBucket === "high"
      ? ["Arche florale", "Chemin de table dore", "Lumieres suspendues", "DJ + sonorisation"]
      : ["Chemins de table elegants", "Composition florale centrale", "Playlist maison"]
  }
  if (type === "birthday") {
    return budgetBucket === "low"
      ? ["Ballons thematique", "Banderole nom", "Playlist personnalisee"]
      : ["Decoration thematique + photobooth", "Gateau assorti", "Animation musicale"]
  }
  if (type === "corporate") {
    return ["Nappage sobre", "Badges et signaletique", "Projecteur + micro"]
  }
  if (type === "karaoke") return ["Scene + micros sans fil", "Eclairage LED", "Ecran paroles"]
  if (type === "buffet") return ["Buffet decore", "Eclairage ambiance"]
  return ["Decoration sobre modulable"]
}

function budgetBucket(guests: number, budget: number) {
  const perHead = budget / Math.max(guests, 1)
  if (perHead < 25) return "low"
  if (perHead < 55) return "mid"
  return "high"
}

function campaignCopy(type: string, date?: string) {
  const dateLabel = date ? ` le ${date}` : ""
  if (type === "wedding") return `Offrez a vos invites un mariage inoubliable${dateLabel} chez Bloudan.`
  if (type === "birthday") return `Celebrez votre anniversaire${dateLabel} avec nos menus signature.`
  if (type === "karaoke") return `Karaoke night${dateLabel} — places limitees, reservez maintenant.`
  if (type === "buffet") return `Buffet a volonte${dateLabel} — specialites levantines.`
  if (type === "corporate") return `Team building gourmand${dateLabel} — menu adapte aux pros.`
  return `Evenement sur mesure${dateLabel} — contactez-nous pour un devis.`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Req
    const type = (body.type || "private").toString().toLowerCase()
    const guests = Math.max(1, Number(body.guests ?? 20))
    const budget = Math.max(0, Number(body.budget ?? 0))
    const menu = suggestMenuByType(type, guests)
    const estimatedCost = Math.round(menu.estimatedPricePerHead * guests)
    const resolvedBudget = budget > 0 ? budget : estimatedCost
    const bucket = budgetBucket(guests, resolvedBudget)
    const decor = suggestDecor(type, bucket)

    const fitScore =
      budget > 0
        ? Math.max(0, Math.min(100, Math.round((resolvedBudget / Math.max(estimatedCost, 1)) * 80)))
        : 82

    const timeline = [
      { t: "J-14", action: "Confirmer nombre invites + allergies" },
      { t: "J-7", action: "Valider menu + decoration" },
      { t: "J-2", action: "Commander stock + briefer equipe" },
      { t: "J-0", action: "Mise en place 2h avant" },
    ]

    let aiNote: string | null = null
    if (isLlmConfigured()) {
      aiNote = await chatCompletion([
        {
          role: "system",
          content:
            "Tu es un Event Planner d'un restaurant levantin haut de gamme. Reponds en francais, 3-4 phrases max, conseils concrets.",
        },
        {
          role: "user",
          content: `Evenement: ${TYPE_LABEL[type] ?? type}, ${guests} invites, budget ${resolvedBudget}€${
            body.date ? ", date " + body.date : ""
          }${body.preferences ? ", preferences: " + body.preferences : ""}. Donne un conseil d'organisation.`,
        },
      ])
    }

    return NextResponse.json({
      agent: "event_planner",
      input: { type, guests, budget, date: body.date, preferences: body.preferences },
      proposal: {
        label: TYPE_LABEL[type] ?? "Evenement",
        menu,
        decor,
        estimatedCost,
        resolvedBudget,
        budgetBucket: bucket,
        fitScore,
        marketingCopy: campaignCopy(type, body.date),
        timeline,
        aiNote,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
