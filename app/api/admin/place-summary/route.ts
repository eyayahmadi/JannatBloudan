/**
 * Résumé lieu Google Places (admin) — GOOGLE_MAPS_API_KEY + GOOGLE_PLACE_ID côté serveur uniquement.
 */
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/admin-api"
import { resolveMapsReviewsRuntime } from "@/lib/server/env-providers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const rt = resolveMapsReviewsRuntime()
  if (!rt.ok) {
    return NextResponse.json({ ok: false, configured: false, message: rt.message }, { status: 503 })
  }

  const fields = "rating,user_ratings_total,reviews,url"
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(rt.placeId)}&fields=${fields}&language=fr&key=${encodeURIComponent(rt.apiKey)}`

  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) {
    return NextResponse.json({ ok: false, message: res.statusText }, { status: 502 })
  }

  const data = (await res.json()) as {
    status?: string
    error_message?: string
    result?: {
      rating?: number
      user_ratings_total?: number
      url?: string
      reviews?: Array<{
        author_name?: string
        rating?: number
        text?: string
        relative_time_description?: string
      }>
    }
  }

  if (data.status !== "OK") {
    return NextResponse.json(
      {
        ok: false,
        googleStatus: data.status ?? "UNKNOWN",
        message: data.error_message ?? "Google Places error",
      },
      { status: 502 },
    )
  }

  const result = data.result ?? {}
  const reviewsSample = (result.reviews ?? []).slice(0, 8).map((r) => ({
    author_name: r.author_name,
    rating: r.rating,
    text: typeof r.text === "string" ? r.text.slice(0, 560) : "",
    relative_time_description: r.relative_time_description,
  }))

  return NextResponse.json({
    ok: true,
    rating: result.rating ?? null,
    user_ratings_total: result.user_ratings_total ?? null,
    url: result.url ?? null,
    reviewsSample,
  })
}
