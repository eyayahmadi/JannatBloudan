/** Client fetch for canonical live menu — never cached by browser/CDN. */
export async function fetchLiveMenuCatalog(includeUnavailable = true): Promise<Response> {
  const qs = new URLSearchParams()
  if (includeUnavailable) qs.set("include_unavailable", "1")
  qs.set("_", String(Date.now()))
  return fetch(`/api/menu?${qs.toString()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })
}

export type MenuFetchDebug = {
  source: string
  categoryCount: number
  productCount: number
  categorySlugs: string[]
  supabaseProject: string | null
  menuSource: string | null
  fetchedAt: string
}

export function parseMenuFetchDebug(data: Record<string, unknown>): MenuFetchDebug {
  const meta = (data.meta ?? {}) as Record<string, unknown>
  const categories = (data.categories ?? []) as Array<{ slug?: string }>
  const items = (data.items ?? []) as unknown[]
  return {
    source: String(data.source ?? "unknown"),
    categoryCount: categories.length,
    productCount: items.length,
    categorySlugs: categories.map((c) => String(c.slug ?? "")),
    supabaseProject: meta.supabase_project != null ? String(meta.supabase_project) : null,
    menuSource: meta.menu_source != null ? String(meta.menu_source) : null,
    fetchedAt: new Date().toISOString(),
  }
}
