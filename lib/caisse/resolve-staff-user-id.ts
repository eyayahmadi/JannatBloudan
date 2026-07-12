import type { SupabaseClient } from "@supabase/supabase-js"

export type StaffAuthProfile = {
  id: string
  email?: string | null
  full_name?: string | null
  phone?: string | null
  role?: string | null
}

export type StaffPaymentCtx = {
  userId: string
  userEmail: string | null
  role: string
  userFullName?: string | null
  userPhone?: string | null
}

function normalizeEmail(email: string | null | undefined): string {
  return typeof email === "string" ? email.trim().toLowerCase() : ""
}

function displayNameFromMeta(meta: Record<string, unknown> | undefined, email: string): string {
  if (!meta) return email
  const full = typeof meta.full_name === "string" ? meta.full_name.trim() : ""
  if (full) return full
  const joined = [meta.first_name, meta.last_name]
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ")
    .trim()
  return joined || email
}

/** Build payment context from Supabase auth session user + normalized app role. */
export function staffPaymentCtxFromAuth(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  role: string,
): StaffPaymentCtx {
  const email = user.email ?? null
  const meta = user.user_metadata
  return {
    userId: user.id,
    userEmail: email,
    role,
    userFullName: displayNameFromMeta(meta, email ?? user.id),
    userPhone: typeof meta?.phone === "string" ? meta.phone : null,
  }
}

/**
 * Resolves auth session user id → public.users.id for FK columns (processed_by, cashier_id).
 * Returns null when no matching staff row exists — never pass auth id that isn't in users.
 */
export async function resolveStaffUserId(
  supabase: SupabaseClient,
  authUserId: string | null | undefined,
  email?: string | null,
): Promise<string | null> {
  const id = typeof authUserId === "string" ? authUserId.trim() : ""
  if (id) {
    const { data } = await supabase.from("users").select("id").eq("id", id).maybeSingle()
    if (data?.id) return String(data.id)
  }

  const mail = normalizeEmail(email)
  if (mail) {
    const { data } = await supabase.from("users").select("id").ilike("email", mail).maybeSingle()
    if (data?.id) return String(data.id)
  }

  return null
}

/**
 * Ensures the cashier exists in public.users before payment FK writes.
 * Auto-provisions from auth profile when sync trigger missed the row.
 */
export async function ensureStaffUserId(
  supabase: SupabaseClient,
  profile: StaffAuthProfile,
): Promise<string | null> {
  const existing = await resolveStaffUserId(supabase, profile.id, profile.email)
  if (existing) return existing

  const email = typeof profile.email === "string" ? profile.email.trim() : ""
  if (!email) return null

  const fullName =
    (typeof profile.full_name === "string" && profile.full_name.trim()) || email
  const role =
    typeof profile.role === "string" && profile.role.trim()
      ? profile.role.trim().toUpperCase()
      : "CASHIER"

  const { error } = await supabase.from("users").insert({
    id: profile.id,
    email,
    full_name: fullName,
    phone: profile.phone ?? null,
    role,
  })

  if (!error) return profile.id

  if (error.code === "23505") {
    return resolveStaffUserId(supabase, profile.id, profile.email)
  }

  console.warn("[ensureStaffUserId]", error.message)
  return resolveStaffUserId(supabase, profile.id, profile.email)
}

export async function ensureStaffUserIdFromCtx(
  supabase: SupabaseClient,
  ctx: StaffPaymentCtx,
): Promise<string | null> {
  return ensureStaffUserId(supabase, {
    id: ctx.userId,
    email: ctx.userEmail,
    full_name: ctx.userFullName,
    phone: ctx.userPhone,
    role: ctx.role,
  })
}
