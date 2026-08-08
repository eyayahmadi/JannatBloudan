import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { compareMenuCardOrder } from "@/lib/menu/menu-order"
import { getActiveProducts } from "@/lib/menu/menu-catalog-service"

export const dynamic = "force-dynamic"

type ProductRow = Record<string, unknown> & {
  display_order?: number | null
  name?: string | null
  categories?: { display_order?: number | null; slug?: string | null } | null
}

function menuOrderFields(p: ProductRow) {
  const cat = p.categories
  return {
    category_display_order: cat?.display_order ?? 0,
    display_order: p.display_order ?? 0,
    id: String(p.id ?? ""),
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category")
    const isVegetarian = searchParams.get("isVegetarian")
    const isVegan = searchParams.get("isVegan")
    const isGlutenFree = searchParams.get("isGlutenFree")
    const isLactoseFree = searchParams.get("isLactoseFree")
    const isHalal = searchParams.get("isHalal")
    const isPopular = searchParams.get("isPopular")
    const spiceLevel = searchParams.get("spiceLevel")
    const sortBy = searchParams.get("sortBy") || "menu-order"

    // Same live catalog as GET /api/menu (non-archived, active categories only)
    const { rows, error } = await getActiveProducts(supabase)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    let products = rows as ProductRow[]

    if (category && category !== "tous") {
      products = products.filter((p) => p.categories?.slug === category)
    }
    if (isVegetarian === "true") {
      products = products.filter((p) => p.is_vegetarian === true)
    }
    if (isVegan === "true") {
      products = products.filter((p) => p.is_vegan === true)
    }
    if (isGlutenFree === "true") {
      products = products.filter((p) => p.is_gluten_free === true)
    }
    if (isLactoseFree === "true") {
      products = products.filter((p) => p.is_lactose_free === true)
    }
    if (isHalal === "true") {
      products = products.filter((p) => p.is_halal === true)
    }
    if (isPopular === "true") {
      products = products.filter((p) => p.is_popular === true)
    }
    if (spiceLevel) {
      products = products.filter((p) => String(p.spice_level ?? "") === spiceLevel)
    }

    switch (sortBy) {
      case "price-asc":
        products = [...products].sort(
          (a, b) => Number(a.price) - Number(b.price) || String(a.name).localeCompare(String(b.name)),
        )
        break
      case "price-desc":
        products = [...products].sort(
          (a, b) => Number(b.price) - Number(a.price) || String(a.name).localeCompare(String(b.name)),
        )
        break
      case "popular":
        products = [...products].sort(
          (a, b) => Number(b.is_popular) - Number(a.is_popular) || String(a.name).localeCompare(String(b.name)),
        )
        break
      case "name":
        products = [...products].sort((a, b) => String(a.name).localeCompare(String(b.name)))
        break
      case "menu-order":
      case "display_order":
      default:
        products = [...products].sort((a, b) => compareMenuCardOrder(menuOrderFields(a), menuOrderFields(b)))
        break
    }

    return NextResponse.json(
      { products, source: "supabase" },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    )
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("products").insert([body]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
