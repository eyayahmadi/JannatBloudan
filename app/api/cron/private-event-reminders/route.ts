/**
 * À appeler depuis un cron (Quotidien) — Bearer CRON_SECRET.
 * Enregistre les intentions de rappel dans event_reminder_log (pas d’email/SMS tant que non branché).
 */
import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function diffDaysUtc(a: Date, b: Date) {
  const ms = startOfUtcDay(a).getTime() - startOfUtcDay(b).getTime()
  return Math.round(ms / 86400000)
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  const auth = req.headers.get("authorization")?.trim()
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!hasServerSupabaseEnv()) {
    return NextResponse.json({ ok: false, message: "Supabase désactivé" })
  }

  const now = new Date()
  const summary = {
    checked: 0,
    reminders_created: 0,
    urgent_prep_alerts: 0,
    skipped_cancelled: 0,
    errors: [] as string[],
  }

  try {
    const supabase = createServiceRoleClient()
    const horizon = new Date(now)
    horizon.setUTCDate(horizon.getUTCDate() + 3)
    const from = now.toISOString().slice(0, 10)
    const to = horizon.toISOString().slice(0, 10)

    const { data: rows, error } = await supabase
      .from("event_requests")
      .select(
        `
        id, status, guest_name, guest_email, guest_phone, event_date, event_time, guests_count, event_type, special_requests,
        quotes:event_quotes(status,deposit_paid,total)
      `,
      )
      .in("status", ["confirmed"])
      .gte("event_date", from)
      .lte("event_date", to)

    if (error) throw new Error(error.message)

    summary.checked = rows?.length ?? 0

    type Row = {
      id: string
      status: string
      guest_name: string | null
      guest_email?: string | null
      guest_phone?: string | null
      event_date: string
      event_time?: string | null
      guests_count?: number | null
      event_type?: string | null
      special_requests?: string | null
      quotes?: { status?: string }[] | null
    }

    for (const r of (rows ?? []) as Row[]) {
      if (r.status === "cancelled") {
        summary.skipped_cancelled++
        continue
      }

      const ev = new Date(`${r.event_date}T12:00:00.000Z`)
      const delta = diffDaysUtc(ev, now)

      const channels: Array<{ key: string; channel: string }> = []
      if (delta === 2) {
        channels.push({ key: "j_minus_2_client", channel: "email" })
        channels.push({ key: "j_minus_2_staff", channel: "admin" })
      } else if (delta === 1) {
        channels.push({ key: "j_minus_1_client", channel: "email" })
        channels.push({ key: "j_minus_1_staff", channel: "admin" })
      } else if (delta === 0) {
        channels.push({ key: "j_minus_0_client", channel: "email" })
        channels.push({ key: "j_minus_0_staff", channel: "admin" })
      }

      const previewText = [
        `Rappel: événement ${r.event_type ?? "privé"} — ${r.guest_name}`,
        `le ${r.event_date}${r.event_time ? ` à ${String(r.event_time).slice(0, 5)}` : ""}`,
        `pour ${r.guests_count ?? "?"} pers.`,
      ].join(" — ")

      for (const c of channels) {
        const { error: insErr } = await supabase.from("event_reminder_log").upsert(
          {
            request_id: r.id,
            reminder_key: c.key,
            channel: c.channel,
            recipient: c.channel === "email" ? (r.guest_email ?? "") : "staff_dashboard",
            payload: {
              message: previewText,
              guest_phone: r.guest_phone,
              special_requests: r.special_requests,
            },
          },
          { onConflict: "request_id,reminder_key" },
        )
        if (insErr?.code === "42P01") {
          summary.errors.push("Migration 19 requise (event_reminder_log)")
          continue
        }
        if (!insErr) summary.reminders_created++
      }

      if (delta === 1 || delta === 0) {
        const { count } = await supabase
          .from("event_preparation_items")
          .select("*", { count: "exact", head: true })
          .eq("request_id", r.id)
          .eq("status", "to_buy")

        const open = count ?? 0
        if (open > 0) {
          const { error: uErr } = await supabase.from("event_reminder_log").upsert(
            {
              request_id: r.id,
              reminder_key: delta === 1 ? "prep_open_j1" : "prep_open_j0",
              channel: "admin",
              recipient: "preparation_dashboard",
              payload: { urgent: true, items_to_buy: open, message: "Checklist incomplète" },
            },
            { onConflict: "request_id,reminder_key" },
          )
          if (!uErr) summary.urgent_prep_alerts++
        }
      }
    }

    return NextResponse.json({ ok: true, ...summary })
  } catch (e) {
    summary.errors.push(String(e))
    return NextResponse.json({ ok: false, ...summary }, { status: 500 })
  }
}
