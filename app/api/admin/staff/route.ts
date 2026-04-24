import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type StaffRow = {
  id: string
  status?: string | null
  hire_date?: string | null
  position?: string | null
  user_id?: string | null
  users?: {
    id?: string | null
    email?: string | null
    full_name?: string | null
    phone?: string | null
    role?: string | null
  } | null
}

type UserRow = {
  id: string
  email?: string | null
  full_name?: string | null
  phone?: string | null
  created_at?: string | null
}

type AuthUser = {
  id: string
  email?: string | null
  created_at?: string | null
  user_metadata?: {
    full_name?: string | null
    phone?: string | null
  } | null
}

const normalizeRole = (value?: string | null) => {
  if (!value) return "server"
  const normalized = value.toLowerCase()
  if (normalized.includes("admin")) return "admin"
  if (normalized.includes("manager")) return "manager"
  if (normalized.includes("cashier") || normalized.includes("caissier")) return "cashier"
  if (normalized.includes("cook") || normalized.includes("cuisinier") || normalized.includes("chef")) return "cook"
  if (normalized.includes("server") || normalized.includes("serveur")) return "server"
  return "server"
}

const normalizeStatus = (value?: string | null) => {
  if (!value) return "active"
  const normalized = value.toLowerCase()
  if (normalized.includes("inactive") || normalized.includes("suspend") || normalized.includes("termin")) {
    return "inactive"
  }
  return "active"
}

const buildName = (value?: { full?: string | null; first?: string | null; last?: string | null; email?: string | null }) => {
  const full = value?.full?.trim()
  if (full) return full
  const first = value?.first?.trim()
  const last = value?.last?.trim()
  const combined = [first, last].filter(Boolean).join(" ")
  if (combined) return combined
  return value?.email?.trim() || "Employe"
}

const toStaffResponse = (input: {
  id: string
  name: string
  email?: string | null
  role?: string | null
  phone?: string | null
  hireDate?: string | null
  status?: string | null
}) => ({
  id: input.id,
  name: input.name,
  email: input.email ?? "",
  role: normalizeRole(input.role),
  phone: input.phone ?? "",
  hireDate: input.hireDate ?? "",
  status: normalizeStatus(input.status),
  performance: {
    ordersServed: 0,
    totalSales: 0,
    rating: 0,
  },
})

const ensureRoleId = async (supabase: any, roleName: string) => {
  try {
    const normalized = roleName?.trim().toLowerCase() || "server"
    const { data: existingRoles, error: roleSelectError } = await supabase
      .from("user_roles")
      .select("id, name")
      .ilike("name", normalized)
      .limit(1)

    if (!roleSelectError && existingRoles && existingRoles.length > 0) {
      return { roleId: existingRoles[0].id as string, warning: null as string | null }
    }

    const { data: createdRole, error: roleInsertError } = await supabase
      .from("user_roles")
      .insert([{ name: normalized }])
      .select("id")
      .single()

    if (roleInsertError || !createdRole?.id) {
      return { roleId: null as string | null, warning: roleInsertError?.message || "Creation du role impossible" }
    }

    return { roleId: createdRole.id as string, warning: null as string | null }
  } catch (err) {
    return { roleId: null as string | null, warning: "Table user_roles introuvable" }
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const errors: string[] = []

    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, status, hire_date, position, user_id, users ( id, email, full_name, phone )")
      .order("hire_date", { ascending: false })

    if (staffError) {
      errors.push(staffError.message)
    }

    if (!staffError && staffData && staffData.length > 0) {
      const staff = (staffData as StaffRow[]).map((row) => {
        const user = row.users
        return toStaffResponse({
          id: row.id,
          name: buildName({ full: user?.full_name, email: user?.email }),
          email: user?.email,
          role: row.position,
          phone: user?.phone,
          hireDate: row.hire_date,
          status: row.status,
        })
      })

      return NextResponse.json({ staff })
    }

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, phone, created_at")
      .order("created_at", { ascending: false })

    if (usersError) {
      errors.push(usersError.message)
    } else if (usersData && usersData.length > 0) {
      const staff = (usersData as UserRow[]).map((user) =>
        toStaffResponse({
          id: user.id,
          name: buildName({ full: user.full_name, email: user.email }),
          email: user.email,
          phone: user.phone,
          hireDate: user.created_at,
        }),
      )

      return NextResponse.json({ staff, warning: errors.length ? errors.join(" | ") : undefined })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      errors.push(authError.message)
    } else if (authData?.users) {
      const staff = (authData.users as AuthUser[]).map((user) =>
        toStaffResponse({
          id: user.id,
          name: buildName({
            full: user.user_metadata?.full_name,
            email: user.email,
          }),
          email: user.email,
          role: "server",
          phone: user.user_metadata?.phone,
          hireDate: user.created_at,
          status: "active",
        }),
      )

      return NextResponse.json({ staff, warning: errors.length ? errors.join(" | ") : undefined })
    }

    return NextResponse.json(
      { staff: [], warning: errors.length ? errors.join(" | ") : "Aucun personnel enregistre pour le moment" },
      { status: 200 },
    )
  } catch (error) {
    console.error("admin/staff GET error", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 })
    }

    const { name, email, phone, role, hireDate, status } = payload as {
      name?: string
      email?: string
      phone?: string
      role?: string
      hireDate?: string
      status?: string
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Nom et email sont obligatoires" }, { status: 400 })
    }

    const supabase = await createClient()
    const normalizedRole = normalizeRole(role)
    const normalizedStatus = normalizeStatus(status)
    const warnings: string[] = []

    const { roleId, warning: roleWarning } = await ensureRoleId(supabase, normalizedRole)
    if (roleWarning) warnings.push(roleWarning)

    const { data: createdUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email,
          full_name: name,
          phone: phone || null,
          role_id: roleId,
        },
      ])
      .select("id, email, full_name, phone, created_at")
      .single()

    if (userError || !createdUser) {
      console.error("admin/staff POST user error", userError)
      return NextResponse.json({ error: userError?.message || "Impossible de creer l'utilisateur" }, { status: 500 })
    }

    const hireDateDate = hireDate ? new Date(hireDate) : new Date()
    const hireDateValue = Number.isNaN(hireDateDate.getTime()) ? new Date().toISOString() : hireDateDate.toISOString()

    const { data: createdStaff, error: staffError } = await supabase
      .from("staff")
      .insert([
        {
          user_id: createdUser.id,
          position: normalizedRole,
          status: normalizedStatus,
          hire_date: hireDateValue,
        },
      ])
      .select("id, status, hire_date, position, user_id")
      .single()

    // Si la table "staff" n'existe pas encore, on renvoie quand même le user comme staff pour ne pas bloquer l'UI
    const missingStaffTable =
      staffError?.message?.toLowerCase().includes("staff") &&
      (staffError.message.toLowerCase().includes("does not exist") ||
        staffError.message.toLowerCase().includes("schema cache"))

    if (missingStaffTable) {
      console.warn("admin/staff POST staff table missing, returning user data only")
      warnings.push("Table staff manquante, utilisateur cree seulement")
      const staff = toStaffResponse({
        id: createdUser.id,
        name: buildName({
          full: createdUser.full_name,
          email: createdUser.email,
        }),
        email: createdUser.email,
        role: normalizedRole,
        phone: createdUser.phone,
        hireDate: createdUser.created_at,
        status: normalizedStatus,
      })
      return NextResponse.json({ staff, warning: warnings.length ? warnings.join(" | ") : undefined })
    }

    if (staffError || !createdStaff) {
      console.error("admin/staff POST staff error", staffError)
      return NextResponse.json({ error: staffError?.message || "Impossible de creer le personnel" }, { status: 500 })
    }

    const staff = toStaffResponse({
      id: createdStaff.id,
      name: buildName({
        full: createdUser.full_name,
        email: createdUser.email,
      }),
      email: createdUser.email,
      role: normalizedRole,
      phone: createdUser.phone,
      hireDate: createdStaff.hire_date,
      status: normalizedStatus,
    })

    return NextResponse.json({ staff, warning: warnings.length ? warnings.join(" | ") : undefined })
  } catch (error) {
    console.error("admin/staff POST error", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
