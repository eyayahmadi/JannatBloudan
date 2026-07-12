import { NextResponse } from "next/server"
import { createServiceRoleClient, requireRoles } from "@/lib/auth/admin-api"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"
import {
  mapOverviewToUnifiedStatus,
  UNIFIED_TABLE_STATUS_META,
} from "@/lib/table-status/unified"

const ROLES = ["ADMIN", "CASHIER", "SERVER"] as const

/**
 * Vue caisse des tables:
 * - états salle + états paiement consolidés
 * - totaux dû/paye/restant
 * - alerte "demande addition" (table_alerts + invoices payment_requested)
 * - compteur de sous-sessions invitées
 */
export async function GET() {
  const guard = await requireRoles(ROLES)
  if (!guard.ok) return guard.response
  if (!hasServerSupabaseEnv()) return NextResponse.json({ tables: [], message: "Pas de base" })

  try {
    const supabase = createServiceRoleClient()
    const { data: tables, error: tErr } = await supabase
      .from("restaurant_tables")
      .select("id, table_number, table_code, display_name, zone, plan_zone, status, capacity, current_session_id, is_active, cleaning_since")
      .order("table_number")

    if (tErr) return NextResponse.json({ tables: [], error: tErr.message })

    const { data: openSessions } = await supabase
      .from("table_sessions")
      .select("id, table_id, total, paid, payment_method, opened_at, updated_at")
      .is("closed_at", null)

    const sessionIds = (openSessions ?? []).map((s) => String(s.id))

    let invoicesBySession = new Map<
      string,
      {
        totalOriginal: number
        finalTotal: number
        paidAmount: number
        remainingAmount: number
        discountAmount: number
        hospitalityAmount: number
        cancelledAmount: number
        paymentRequested: boolean
        unpaidInvoices: number
        partialInvoices: number
      }
    >()

    if (sessionIds.length > 0) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select(
          "id, session_id, gross_before_discount, total, discount_amount, billing_type, status, payment_stage, payment_split",
        )
        .in("session_id", sessionIds)

      const seed = () => ({
        totalOriginal: 0,
        finalTotal: 0,
        paidAmount: 0,
        remainingAmount: 0,
        discountAmount: 0,
        hospitalityAmount: 0,
        cancelledAmount: 0,
        paymentRequested: false,
        unpaidInvoices: 0,
        partialInvoices: 0,
      })

      for (const inv of invoices ?? []) {
        const sid = String((inv as { session_id?: string | null }).session_id ?? "")
        if (!sid) continue
        const agg = invoicesBySession.get(sid) ?? seed()

        const status = String((inv as { status?: string | null }).status ?? "").toLowerCase()
        const stage = String((inv as { payment_stage?: string | null }).payment_stage ?? "").toLowerCase()
        const billing = String((inv as { billing_type?: string | null }).billing_type ?? "").toLowerCase()
        const total = Number((inv as { total?: number | null }).total ?? 0)
        const original = Number((inv as { gross_before_discount?: number | null }).gross_before_discount ?? total)
        const discount = Number((inv as { discount_amount?: number | null }).discount_amount ?? 0)

        agg.totalOriginal += original
        agg.finalTotal += total
        agg.discountAmount += discount

        if (billing === "hospitality" || billing === "complimentary") {
          agg.hospitalityAmount += total
        }
        if (status === "cancelled") {
          agg.cancelledAmount += total
        }

        const split = Array.isArray((inv as { payment_split?: unknown }).payment_split)
          ? ((inv as { payment_split: Array<{ amount?: number }> }).payment_split ?? [])
          : []
        const splitPaid = split.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
        const paid = status === "paid" ? (split.length ? splitPaid : total) : Math.max(0, splitPaid)
        const remaining = Math.max(0, total - paid)

        agg.paidAmount += paid
        agg.remainingAmount += remaining

        if (stage === "payment_requested") agg.paymentRequested = true
        if (remaining > 0.001 && paid > 0.001) agg.partialInvoices += 1
        if (remaining > 0.001 && paid <= 0.001) agg.unpaidInvoices += 1

        invoicesBySession.set(sid, agg)
      }
    }

    const { data: billAlerts } = await supabase
      .from("table_alerts")
      .select("id, table_id, type, created_at, resolved_at, order_id")
      .eq("type", "request_bill")
      .is("resolved_at", null)

    const { data: waiterAlerts } = await supabase
      .from("table_alerts")
      .select("id, table_id, type, created_at, resolved_at, order_id")
      .eq("type", "call_server")
      .is("resolved_at", null)

    const { data: cashierAlerts } = await supabase
      .from("table_alerts")
      .select("id, table_id, type, created_at, resolved_at")
      .eq("type", "call_cashier")
      .is("resolved_at", null)

    type AlertAgg = { count: number; latestAt: string | null; latestId: string | null }
    const emptyAgg = (): AlertAgg => ({ count: 0, latestAt: null, latestId: null })

    const billByTable = new Map<number, AlertAgg>()
    for (const a of billAlerts ?? []) {
      const tableId = Number((a as { table_id?: number }).table_id ?? 0)
      if (!Number.isFinite(tableId) || tableId <= 0) continue
      const prev = billByTable.get(tableId) ?? emptyAgg()
      const createdAt = String((a as { created_at?: string | null }).created_at ?? "")
      const id = String((a as { id?: string }).id ?? "")
      const isNewer = !prev.latestAt || createdAt > prev.latestAt
      billByTable.set(tableId, {
        count: prev.count + 1,
        latestAt: isNewer ? createdAt : prev.latestAt,
        latestId: isNewer ? id : prev.latestId,
      })
    }

    const waiterByTable = new Map<number, AlertAgg>()
    for (const a of waiterAlerts ?? []) {
      const tableId = Number((a as { table_id?: number }).table_id ?? 0)
      if (!Number.isFinite(tableId) || tableId <= 0) continue
      const prev = waiterByTable.get(tableId) ?? emptyAgg()
      const createdAt = String((a as { created_at?: string | null }).created_at ?? "")
      const id = String((a as { id?: string }).id ?? "")
      const isNewer = !prev.latestAt || createdAt > prev.latestAt
      waiterByTable.set(tableId, {
        count: prev.count + 1,
        latestAt: isNewer ? createdAt : prev.latestAt,
        latestId: isNewer ? id : prev.latestId,
      })
    }

    const serviceRequestsByTable = new Map<
      number,
      Array<{ id: string; request_type: "WAITER" | "BILL"; requested_at: string; order_id: string | null }>
    >()
    const pushServiceRequest = (
      tableId: number,
      row: { id: string; request_type: "WAITER" | "BILL"; requested_at: string; order_id: string | null },
    ) => {
      const list = serviceRequestsByTable.get(tableId) ?? []
      list.push(row)
      serviceRequestsByTable.set(tableId, list)
    }
    for (const a of waiterAlerts ?? []) {
      const tableId = Number((a as { table_id?: number }).table_id ?? 0)
      if (!Number.isFinite(tableId) || tableId <= 0) continue
      pushServiceRequest(tableId, {
        id: String((a as { id?: string }).id ?? ""),
        request_type: "WAITER",
        requested_at: String((a as { created_at?: string }).created_at ?? ""),
        order_id: (a as { order_id?: string | null }).order_id
          ? String((a as { order_id?: string }).order_id)
          : null,
      })
    }
    for (const a of billAlerts ?? []) {
      const tableId = Number((a as { table_id?: number }).table_id ?? 0)
      if (!Number.isFinite(tableId) || tableId <= 0) continue
      pushServiceRequest(tableId, {
        id: String((a as { id?: string }).id ?? ""),
        request_type: "BILL",
        requested_at: String((a as { created_at?: string }).created_at ?? ""),
        order_id: (a as { order_id?: string | null }).order_id
          ? String((a as { order_id?: string }).order_id)
          : null,
      })
    }

    let mergesBySession = new Map<string, { count: number; sources: number[] }>()
    if (sessionIds.length > 0) {
      const { data: merges } = await supabase
        .from("table_session_merges")
        .select("main_session_id, merged_table_id")
        .in("main_session_id", sessionIds)
      for (const m of merges ?? []) {
        const sid = String((m as { main_session_id?: string | null }).main_session_id ?? "")
        if (!sid) continue
        const prev = mergesBySession.get(sid) ?? { count: 0, sources: [] }
        const tid = Number((m as { merged_table_id?: number | null }).merged_table_id ?? 0)
        prev.count += 1
        if (Number.isFinite(tid) && tid > 0) prev.sources.push(tid)
        mergesBySession.set(sid, prev)
      }
    }

    const cashierByTable = new Map<number, { count: number; latestAt: string | null }>()
    for (const a of cashierAlerts ?? []) {
      const tid = Number((a as { table_id?: number }).table_id ?? 0)
      if (!Number.isFinite(tid) || tid <= 0) continue
      const prev = cashierByTable.get(tid) ?? { count: 0, latestAt: null }
      const createdAt = String((a as { created_at?: string | null }).created_at ?? "")
      cashierByTable.set(tid, {
        count: prev.count + 1,
        latestAt: !prev.latestAt || createdAt > prev.latestAt ? createdAt : prev.latestAt,
      })
    }

    const parentSessionIds = (openSessions ?? []).map((s) => String(s.id))
    let guestsBySession = new Map<string, number>()
    if (parentSessionIds.length > 0) {
      const { data: guests } = await supabase
        .from("guest_sessions")
        .select("id, parent_session_id")
        .in("parent_session_id", parentSessionIds)
      for (const g of guests ?? []) {
        const sid = String((g as { parent_session_id?: string | null }).parent_session_id ?? "")
        if (!sid) continue
        guestsBySession.set(sid, (guestsBySession.get(sid) ?? 0) + 1)
      }
    }

    const out = (tables ?? []).map((t) => {
      const sess = (openSessions ?? []).find(
        (s) => Number(s.table_id) === Number((t as { id?: number }).id),
      )
      const tableId = Number((t as { id?: number }).id ?? 0)
      const sid = String(sess?.id ?? "")
      const fin = sid ? invoicesBySession.get(sid) : undefined
      const alert = billByTable.get(tableId)
      const waiterAlert = waiterByTable.get(tableId)
      const cashierAlert = cashierByTable.get(tableId)
      const serviceRequests = serviceRequestsByTable.get(tableId) ?? []
      const mergeInfo = sid ? mergesBySession.get(sid) : null

      let paymentStage = "libre"
      let paymentStatusCode:
        | "FREE"
        | "OCCUPIED"
        | "ORDER_IN_PROGRESS"
        | "READY_TO_PAY"
        | "PAYMENT_REQUESTED"
        | "PAID"
        | "UNPAID"
        | "PARTIAL"
        | "NEEDS_CLEANING"
        | "CLOSED" = "FREE"

      const restaurantStatus = String((t as { status?: string | null }).status ?? "").toUpperCase()
      const cleaningSince = (t as { cleaning_since?: string | null }).cleaning_since ?? null
      const isCleaning =
        restaurantStatus === "CLEANING" ||
        restaurantStatus === "NEEDS_CLEANING" ||
        Boolean(cleaningSince)

      const totalDue = Number(fin?.finalTotal ?? sess?.total ?? 0)
      const paidAmount = Number(fin?.paidAmount ?? (sess?.paid ? totalDue : 0))
      const remainingAmount = Math.max(0, totalDue - paidAmount)
      const hasRequestedBill = Boolean(alert?.count) || Boolean(fin?.paymentRequested)
      const hasWaiterRequest = Boolean(waiterAlert?.count)
      const hasPartial = (fin?.partialInvoices ?? 0) > 0 || (paidAmount > 0.001 && remainingAmount > 0.001)
      const sessionPaid = Boolean(sess?.paid) || (remainingAmount <= 0.001 && totalDue > 0)

      if (isCleaning && !sess) {
        paymentStage = "à nettoyer"
        paymentStatusCode = "NEEDS_CLEANING"
      } else if (!sess) {
        paymentStage = "libre"
        paymentStatusCode = "FREE"
      } else if (sessionPaid) {
        paymentStage = "payée"
        paymentStatusCode = "PAID"
      } else if (hasRequestedBill) {
        paymentStage = "paiement demandé"
        paymentStatusCode = "PAYMENT_REQUESTED"
      } else if (hasPartial) {
        paymentStage = "paiement partiel"
        paymentStatusCode = "PARTIAL"
      } else if (totalDue > 0.001) {
        paymentStage = "non payée"
        paymentStatusCode = "UNPAID"
      } else if (restaurantStatus === "READY" || restaurantStatus === "PAYMENT_REQUESTED") {
        paymentStage = "prête à payer"
        paymentStatusCode = "READY_TO_PAY"
      } else {
        paymentStage = "commande en cours"
        paymentStatusCode = "ORDER_IN_PROGRESS"
      }

      const row = {
        table_id: t.id,
        table_number: t.table_number,
        table_code: (t as { table_code?: string | null }).table_code ?? null,
        display_name: (t as { display_name?: string | null }).display_name ?? null,
        is_active: (t as { is_active?: boolean | null }).is_active !== false,
        zone: t.zone,
        restaurant_status: (t as { status?: string | null }).status ?? null,
        cleaning_since: cleaningSince,
        payment_status_label: paymentStage,
        payment_status_code: paymentStatusCode,
        has_payment_request_alert: hasRequestedBill,
        payment_request_count: alert?.count ?? 0,
        payment_request_latest_at: alert?.latestAt ?? null,
        payment_request_alert_id: alert?.latestId ?? null,
        has_waiter_request_alert: hasWaiterRequest,
        waiter_request_count: waiterAlert?.count ?? 0,
        waiter_request_latest_at: waiterAlert?.latestAt ?? null,
        waiter_request_alert_id: waiterAlert?.latestId ?? null,
        service_requests: serviceRequests,
        has_cashier_call_alert: Boolean(cashierAlert?.count),
        cashier_call_count: cashierAlert?.count ?? 0,
        cashier_call_latest_at: cashierAlert?.latestAt ?? null,
        merged_count: mergeInfo?.count ?? 0,
        merged_from_table_ids: mergeInfo?.sources ?? [],
        guests_or_sessions_count: sid ? 1 + Number(guestsBySession.get(sid) ?? 0) : 0,
        session: sess
          ? {
              id: sess.id,
              total: totalDue,
              total_original: Number(fin?.totalOriginal ?? totalDue),
              paid_amount: paidAmount,
              remaining_amount: remainingAmount,
              discount_amount: Number(fin?.discountAmount ?? 0),
              hospitality_amount: Number(fin?.hospitalityAmount ?? 0),
              cancelled_amount: Number(fin?.cancelledAmount ?? 0),
              paid: sessionPaid,
              payment_method: sess.payment_method ?? null,
              payment_stage: paymentStage,
              payment_status_code: paymentStatusCode,
              opened_at: (sess as { opened_at?: string | null }).opened_at ?? null,
              updated_at: (sess as { updated_at?: string | null }).updated_at ?? null,
            }
          : null,
      }
      const unified_status = mapOverviewToUnifiedStatus(row)
      return {
        ...row,
        unified_status,
        unified_status_label: UNIFIED_TABLE_STATUS_META[unified_status].label,
      }
    })

    return NextResponse.json({ tables: out, role: guard.role })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
