/**
 * Tajine + Hauptgerichte — fallback catalog when DB migration 65 is not applied yet.
 * Merged into GET /api/menu so QR menu, public /menu, POS, and admin see the same items.
 * Once products exist in Supabase (by slug), DB rows take precedence.
 */

export type MenuCategoryFallbackRow = {
  id: string
  name: string
  slug: string
  section: string
  display_order: number
  icon_emoji: string | null
  name_ar: string | null
  description: string | null
}

export type MenuProductFallbackRow = {
  id: string
  slug: string
  name: string
  name_ar: string | null
  description: string
  description_ar: string | null
  price: number
  category: string
  categoryName: string
  category_display_order: number
  display_order: number
  section: string
  station: string
  image_url: string | null
}

const CATALOG_PREFIX = "catalog-tajine-haupt"

export const TAJINE_HAUPTGERICHTE_CATEGORIES: MenuCategoryFallbackRow[] = [
  {
    id: `${CATALOG_PREFIX}-cat-tajine`,
    slug: "tajine",
    name: "Tajine",
    name_ar: "الطواجن",
    section: "food",
    display_order: 35,
    icon_emoji: "🍲",
    description: null,
  },
  {
    id: `${CATALOG_PREFIX}-cat-hauptgerichte`,
    slug: "hauptgerichte",
    name: "Hauptgerichte",
    name_ar: "الطبخات",
    section: "food",
    display_order: 36,
    icon_emoji: "🥘",
    description: null,
  },
]

type ProductDef = Omit<
  MenuProductFallbackRow,
  "id" | "categoryName" | "category_display_order" | "section" | "station" | "image_url"
> & { category: "tajine" | "hauptgerichte" }

const PRODUCT_DEFS: ProductDef[] = [
  {
    slug: "tajine-kebab-hindi-mit-weissem-reis",
    name: "Tajine Kebab Hindi mit weißem Reis",
    name_ar: "طاجن كباب هندي مع رز أبيض",
    description: "Hackfleisch mit geschmorten Tomaten und Zwiebeln, serviert mit weißem Reis.",
    description_ar: "لحم مفروم، بندورة مطبوخة مع بصل.",
    price: 20,
    display_order: 10,
    category: "tajine",
  },
  {
    slug: "tajine-mandi-mit-lammfleisch",
    name: "Tajine Mandi mit Lammfleisch",
    name_ar: "طاجن مندي باللحم",
    description: "Aromatischer Mandi-Reis mit zartem Lammfleisch und Daqous-Sauce.",
    description_ar: "رز مندي مع لحم وصوص دقوس.",
    price: 20,
    display_order: 20,
    category: "tajine",
  },
  {
    slug: "tajine-mandi-mit-haehnchen",
    name: "Tajine Mandi mit Hähnchen",
    name_ar: "طاجن مندي بالدجاج",
    description: "Aromatischer Mandi-Reis mit saftigem Hähnchen und Daqous-Sauce.",
    description_ar: "رز مندي مع دجاج وصوص دقوس.",
    price: 20,
    display_order: 30,
    category: "tajine",
  },
  {
    slug: "tajine-shish",
    name: "Tajine Shish",
    name_ar: "طاجن شيش",
    description: "Zartes Hähnchen mit Champignons in cremiger Sauce.",
    description_ar: "دجاج مطبوخ مع كريمة وفطر.",
    price: 20,
    display_order: 40,
    category: "tajine",
  },
  {
    slug: "tajine-lahmeh-bil-sahn-mit-tomaten",
    name: "Tajine Lahmeh bil Sahn mit Tomaten",
    name_ar: "طاجن لحمة بالصحن مع بندورة",
    description: "Gebratenes Fleisch mit geschmorten Tomaten, im Tontopf serviert.",
    description_ar: "طاجن لحمة بالصحن مع بندورة",
    price: 20,
    display_order: 50,
    category: "tajine",
  },
  {
    slug: "tajine-lahmeh-bil-sahn-mit-tahini",
    name: "Tajine Lahmeh bil Sahn mit Tahini",
    name_ar: "طاجن لحمة بالصحن مع طحينية",
    description: "Gebratenes Fleisch mit cremiger Tahini-Sauce, im Tontopf serviert.",
    description_ar: "طاجن لحمة بالصحن مع طحينية",
    price: 20,
    display_order: 60,
    category: "tajine",
  },
  {
    slug: "shakriyeh-mit-weissem-reis",
    name: "Shakriyeh mit weißem Reis",
    name_ar: "شاكرية ورز أبيض",
    description: "Frisch gekochte Joghurtsauce mit zartem Fleisch, serviert mit weißem Reis.",
    description_ar: "لبن مطبوخ مع لحم.",
    price: 20,
    display_order: 10,
    category: "hauptgerichte",
  },
  {
    slug: "kibbeh-labaniyeh-mit-weissem-reis",
    name: "Kibbeh Labaniyeh mit weißem Reis",
    name_ar: "كبة لبنية ورز أبيض",
    description:
      "Mit Fleisch, Zwiebeln und Walnüssen gefüllte Bulgur-Kibbeh in gekochter Joghurtsauce, serviert mit weißem Reis.",
    description_ar: "أقراص برغل محشية باللحم والبصل والجوز باللبن المطبوخ.",
    price: 20,
    display_order: 20,
    category: "hauptgerichte",
  },
  {
    slug: "shish-barak",
    name: "Shish Barak",
    name_ar: "شيش برك",
    description: "Mit Fleisch, Zwiebeln und Koriander gefüllte Teigtaschen in gekochter Joghurtsauce.",
    description_ar: "أقراص عجين محشية باللحم والبصل والكزبرة مع اللبن المطبوخ.",
    price: 20,
    display_order: 30,
    category: "hauptgerichte",
  },
  {
    slug: "basha-wa-asakro",
    name: "Basha wa Asakro",
    name_ar: "باشا وعساكرو",
    description: "Mit Fleisch, Zwiebeln und Koriander gefüllte Bulgur- und Teigtaschen in einer traditionellen Sauce.",
    description_ar: "أقراص برغل وعجين محشية لحم وبصل وكزبرة.",
    price: 20,
    display_order: 40,
    category: "hauptgerichte",
  },
  {
    slug: "jaddi-bil-zeit",
    name: "Jaddi bil Zeit",
    name_ar: "جدي بالزيت",
    description: "Geschmortes Fleisch mit Kartoffeln und Karotten, serviert mit weißem Reis.",
    description_ar: "لحم مطبوخ مع بطاطا وجزر ورز أبيض.",
    price: 20,
    display_order: 50,
    category: "hauptgerichte",
  },
]

const CATEGORY_BY_SLUG = new Map(TAJINE_HAUPTGERICHTE_CATEGORIES.map((c) => [c.slug, c]))

function catalogProductId(slug: string): string {
  return `${CATALOG_PREFIX}-prod-${slug}`
}

export function buildTajineHauptgerichteFallbackProducts(): MenuProductFallbackRow[] {
  return PRODUCT_DEFS.map((p) => {
    const cat = CATEGORY_BY_SLUG.get(p.category)!
    return {
      id: catalogProductId(p.slug),
      slug: p.slug,
      name: p.name,
      name_ar: p.name_ar,
      description: p.description,
      description_ar: p.description_ar,
      price: p.price,
      category: p.category,
      categoryName: cat.name,
      category_display_order: cat.display_order,
      display_order: p.display_order,
      section: cat.section,
      station: "KITCHEN",
      image_url: "/placeholder.svg",
    }
  })
}

type EnrichedLike = MenuProductFallbackRow & {
  is_popular?: boolean
  is_new?: boolean
  is_vegetarian?: boolean
  spice_level?: string | null
  is_chef_choice?: boolean
  is_recommended?: boolean
  tags?: string[]
  availability?: "available" | "limited" | "out"
  max_orderable?: number
  limited_reason?: string | null
  can_order?: boolean
  created_at?: string | null
  order_count?: number
  modifiers?: unknown[]
  variants?: unknown[]
  has_variants?: boolean
  is_customizable?: boolean
  station_status?: string
  station_accepting_orders?: boolean
  station_hidden?: boolean
}

function toEnrichedProduct(row: MenuProductFallbackRow): EnrichedLike {
  return {
    ...row,
    is_popular: false,
    is_new: false,
    is_vegetarian: false,
    spice_level: null,
    is_chef_choice: false,
    is_recommended: false,
    tags: [],
    availability: "available",
    max_orderable: 100,
    limited_reason: null,
    can_order: true,
    created_at: null,
    order_count: 0,
    modifiers: [],
    variants: [],
    has_variants: false,
    is_customizable: false,
    station_status: "OPEN",
    station_accepting_orders: true,
    station_hidden: false,
  }
}

/** Inject missing Tajine/Hauptgerichte categories + products (DB wins on slug match). */
export function mergeTajineHauptgerichteCatalog<
  C extends MenuCategoryFallbackRow,
  P extends { slug?: string; category?: string },
>(categories: C[], products: P[]): { categories: C[]; products: P[] } {
  const catSlugs = new Set(categories.map((c) => c.slug))
  const productSlugs = new Set(
    products.map((p) => String((p as { slug?: string }).slug ?? "")).filter(Boolean),
  )

  const nextCategories = [...categories]
  for (const cat of TAJINE_HAUPTGERICHTE_CATEGORIES) {
    if (!catSlugs.has(cat.slug)) {
      nextCategories.push(cat as C)
      catSlugs.add(cat.slug)
    }
  }
  nextCategories.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const nextProducts = [...products]
  for (const row of buildTajineHauptgerichteFallbackProducts()) {
    if (productSlugs.has(row.slug)) continue
    nextProducts.push(toEnrichedProduct(row) as unknown as P)
    productSlugs.add(row.slug)
  }

  return { categories: nextCategories, products: nextProducts }
}
