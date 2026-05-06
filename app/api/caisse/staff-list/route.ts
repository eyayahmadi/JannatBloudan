import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Employés RH pour liste avances (minimal). */
export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv())
    return NextResponse.json({ staff: [] })

  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from("staff")
      .select("id, position, status, user_id")
      .eq("status", "active")

    if (error) return NextResponse.json({ staff: [], error: error.message })
    return NextResponse.json({ staff: data ?? [] })
  } catch (e) {
    return NextResponse.json({ staff: [], error: String(e) })
  }
}
