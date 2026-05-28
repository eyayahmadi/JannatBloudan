import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

const ALLOW = ["ADMIN", "CASHIER"] as const

/** Employés actifs avec libellé affichable (liste sorties caisse / avances). */
export async function GET() {
  const guard = await requireRoles(ALLOW)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ staff: [] })

  try {
    const supabase = createServiceRoleClient()
    const { data: staffRows, error } = await supabase
      .from("staff")
      .select("id, position, status, user_id")
      .eq("status", "active")

    if (error) return NextResponse.json({ staff: [], error: error.message })

    const uids = [...new Set((staffRows ?? []).map((s) => (s as { user_id?: string }).user_id).filter(Boolean))]
    let userMap: Record<string, { full_name?: string | null; email?: string | null; role?: string | null }> = {}
    if (uids.length) {
      const { data: usersData } = await supabase.from("users").select("id, full_name, email, role").in("id", uids as string[])
      userMap = Object.fromEntries(
        (usersData ?? []).map((u) => {
          const id = String((u as { id: string }).id)
          return [id, u as (typeof userMap)[string]]
        }),
      )
    }

    const flattened = (staffRows ?? []).map((row) => {
      const r = row as {
        id: string
        position?: string | null
        status?: string | null
        user_id?: string | null
      }
      const u = r.user_id ? userMap[r.user_id] : undefined
      const name = [u?.full_name?.trim(), r.position ?? ""].filter(Boolean).join(" · ")
      return {
        id: r.id,
        position: r.position ?? null,
        status: r.status ?? null,
        user_id: r.user_id ?? null,
        employee_label: name || String(r.position ?? ""),
      }
    })

    return NextResponse.json({ staff: flattened })
  } catch (e) {
    return NextResponse.json({ staff: [], error: String(e) })
  }
}
