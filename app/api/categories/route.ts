import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getActiveCategories } from "@/lib/menu/menu-catalog-service"

/** Public categories — same visibility rules as GET /api/menu. */
export async function GET() {
  try {
    const supabase = await createClient()
    const { rows, error } = await getActiveCategories(supabase)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ categories: rows, source: "supabase" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
