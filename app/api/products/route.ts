import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { compareMenuCardOrder } from "@/lib/menu/menu-order"

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

    // Filtres
    const category = searchParams.get("category")
    const isVegetarian = searchParams.get("isVegetarian")
    const isVegan = searchParams.get("isVegan")
    const isGlutenFree = searchParams.get("isGlutenFree")
    const isLactoseFree = searchParams.get("isLactoseFree")
    const isHalal = searchParams.get("isHalal")
    const isPopular = searchParams.get("isPopular")
    const spiceLevel = searchParams.get("spiceLevel")
    const sortBy = searchParams.get("sortBy") || "menu-order"

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          display_order
        )
      `)
      .eq("is_available", true)

    // Appliquer les filtres
    if (category && category !== "tous") {
      query = query.eq("categories.slug", category)
    }
    if (isVegetarian === "true") {
      query = query.eq("is_vegetarian", true)
    }
    if (isVegan === "true") {
      query = query.eq("is_vegan", true)
    }
    if (isGlutenFree === "true") {
      query = query.eq("is_gluten_free", true)
    }
    if (isLactoseFree === "true") {
      query = query.eq("is_lactose_free", true)
    }
    if (isHalal === "true") {
      query = query.eq("is_halal", true)
    }
    if (isPopular === "true") {
      query = query.eq("is_popular", true)
    }
    if (spiceLevel) {
      query = query.eq("spice_level", spiceLevel)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let products = (data ?? []) as ProductRow[]

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

    return NextResponse.json({ products })
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
