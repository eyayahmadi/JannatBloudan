/**
 * Seed the Supabase "events" table with sample events.
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-events.ts
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey)

async function main() {
  const now = new Date()
  const dateStr = (offsetDays: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().slice(0, 10)
  }

  const rows = [
    {
      title: "Mariage Dupont-Martin",
      description: "Réception de mariage avec menu gastronomique",
      event_date: dateStr(7),
      start_time: "18:00",
      end_time: "23:00",
    },
    {
      title: "Anniversaire Sophie",
      description: "Cocktail et buffet pour 30 ans",
      event_date: dateStr(10),
      start_time: "19:30",
      end_time: "22:30",
    },
    {
      title: "Soirée TechCorp",
      description: "Événement corporate de fin d'année",
      event_date: dateStr(14),
      start_time: "18:30",
      end_time: "22:00",
    },
    {
      title: "Concert Jazz",
      description: "Soirée jazz live avec dîner spectacle",
      event_date: dateStr(21),
      start_time: "21:00",
      end_time: "23:30",
    },
  ]

  const { data, error } = await supabase.from("events").insert(rows).select()
  if (error) {
    console.error("Seed failed:", error.message)
    process.exit(1)
  }

  console.log("Seeded events:", data?.map((r) => ({ id: r.id, title: r.title })))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
