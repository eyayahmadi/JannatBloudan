/**
 * GET  /api/deliveries           -> liste des livraisons (filtrable ?driver=…&status=…)
 * POST /api/deliveries           -> creer une livraison a partir d'une commande
 *
 * Hybride : tente Supabase (table delivery_trackings) puis retombe sur un
 * jeu de donnees en memoire si la migration n'est pas encore appliquee.
 */
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

type SupabaseAny = Awaited<ReturnType<typeof createClient>>

async function fetchFromSupabase(
  supabase: SupabaseAny,
  filters: { driver?: string | null; status?: string | null },
) {
  let query = supabase
    .from("delivery_trackings")
    .select("*")
    .order("created_at", { ascending: false })
  if (filters.driver) query = query.eq("driver_id", filters.driver)
  if (filters.status) query = query.eq("status", filters.status)
  return await query
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const driver = searchParams.get("driver")
  const status = searchParams.get("status")
  try {
    const supabase = await createClient()
    const { data, error } = await fetchFromSupabase(supabase, { driver, status })
    if (error) {
      // table probablement absente → fallback mode demo
      return NextResponse.json({
        deliveries: [],
        _warning: `Supabase indisponible: ${error.message}`,
        _source: "fallback",
      })
    }
    return NextResponse.json({ deliveries: data ?? [], _source: "supabase" })
  } catch (err) {
    return NextResponse.json(
      {
        deliveries: [],
        _source: "fallback",
        _warning: err instanceof Error ? err.message : "Erreur serveur",
      },
      { status: 200 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const payload = {
      order_id: body.order_id,
      order_number: body.order_number ?? `DLV-${Date.now()}`,
      driver_id: body.driver_id ?? null,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      delivery_address: body.delivery_address,
      delivery_notes: body.delivery_notes ?? null,
      pickup_lat: body.pickup_location?.lat,
      pickup_lng: body.pickup_location?.lng,
      delivery_lat: body.delivery_location?.lat,
      delivery_lng: body.delivery_location?.lng,
      status: body.status ?? "pending",
      payment_status: body.payment_status ?? "pending",
      total_amount: body.total_amount ?? 0,
    }
    const { data, error } = await supabase
      .from("delivery_trackings")
      .insert([payload])
      .select()
      .single()
    if (error) {
      return NextResponse.json(
        { error: error.message, _source: "fallback" },
        { status: 500 },
      )
    }
    return NextResponse.json({ delivery: data, _source: "supabase" })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    )
  }
}
