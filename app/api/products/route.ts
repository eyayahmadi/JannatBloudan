import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
    const sortBy = searchParams.get("sortBy") || "name"

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          slug
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

    // Tri
    switch (sortBy) {
      case "price-asc":
        query = query.order("price", { ascending: true })
        break
      case "price-desc":
        query = query.order("price", { ascending: false })
        break
      case "popular":
        query = query.order("is_popular", { ascending: false })
        break
      case "name":
      default:
        query = query.order("name", { ascending: true })
        break
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data })
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
