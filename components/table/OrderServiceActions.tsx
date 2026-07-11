"use client"

import { useEffect, useState } from "react"
import { HandPlatter, Loader2, Receipt } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import { useI18n } from "@/lib/i18n/context"
import { buildGuestServiceAlertMessage } from "@/lib/table/guest-service-alerts"
import { cn } from "@/lib/utils"

type PendingKind = "waiter" | "bill" | null

type OrderServiceActionsProps = {
  tableNumber: number | string
  orderNumber?: string
  className?: string
}

type ToastState = {
  message: string
  variant: "success" | "error"
} | null

export function OrderServiceActions({ tableNumber, orderNumber, className }: OrderServiceActionsProps) {
  const { t } = useI18n()
  const { raiseAsync, alerts, remoteAuthoritative } = useTableAlerts()
  const [confirmKind, setConfirmKind] = useState<PendingKind>(null)
  const [sending, setSending] = useState<PendingKind>(null)
  const [waiterLocked, setWaiterLocked] = useState(false)
  const [billLocked, setBillLocked] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  const tableKey = String(tableNumber)

  useEffect(() => {
    if (!remoteAuthoritative) return
    const pending = alerts.filter((a) => a.tableId === tableKey && !a.resolvedAt)
    setWaiterLocked(pending.some((a) => a.type === "call_server"))
    setBillLocked(pending.some((a) => a.type === "request_bill"))
  }, [alerts, remoteAuthoritative, tableKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const sendWaiterRequest = async () => {
    setSending("waiter")
    const { ok } = await raiseAsync({
      tableId: tableKey,
      type: "call_server",
      message: buildGuestServiceAlertMessage({
        kind: "waiter",
        tableNumber,
        orderNumber,
      }),
    })
    setSending(null)
    setConfirmKind(null)
    if (ok) {
      setWaiterLocked(true)
      setToast({ message: t("guestService.toastWaiter"), variant: "success" })
    } else {
      setToast({ message: t("guestService.toastError"), variant: "error" })
    }
  }

  const sendBillRequest = async () => {
    setSending("bill")
    const { ok } = await raiseAsync({
      tableId: tableKey,
      type: "request_bill",
      message: buildGuestServiceAlertMessage({
        kind: "bill",
        tableNumber,
        orderNumber,
      }),
    })
    setSending(null)
    setConfirmKind(null)
    if (ok) {
      setBillLocked(true)
      setToast({ message: t("guestService.toastBill"), variant: "success" })
    } else {
      setToast({ message: t("guestService.toastError"), variant: "error" })
    }
  }

  const waiterDisabled = waiterLocked || sending === "waiter"
  const billDisabled = billLocked || sending === "bill"
  const dialogBusy = sending !== null

  return (
    <>
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
        <ServiceActionButton
          emoji="👨‍🍳"
          icon={HandPlatter}
          label={t("guestService.requestWaiter")}
          sub={waiterLocked ? t("guestService.pendingWaiter") : t("guestService.requestWaiterSub")}
          disabled={waiterDisabled}
          loading={sending === "waiter"}
          onClick={() => setConfirmKind("waiter")}
        />
        <ServiceActionButton
          emoji="💳"
          icon={Receipt}
          label={t("guestService.requestBill")}
          sub={billLocked ? t("guestService.pendingBill") : t("guestService.requestBillSub")}
          disabled={billDisabled}
          loading={sending === "bill"}
          onClick={() => setConfirmKind("bill")}
        />
      </div>

      {toast ? (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 left-1/2 z-[120] max-w-sm -translate-x-1/2 rounded-2xl border px-5 py-3 text-center text-sm font-medium shadow-lg",
            toast.variant === "success"
              ? "border-emerald-200/80 bg-white text-emerald-900 dark:border-emerald-800/50 dark:bg-neutral-900 dark:text-emerald-200"
              : "border-rose-200/80 bg-white text-rose-900 dark:border-rose-800/50 dark:bg-neutral-900 dark:text-rose-200",
          )}
        >
          {toast.message}
        </div>
      ) : null}

      <AlertDialog
        open={confirmKind === "waiter"}
        onOpenChange={(open) => {
          if (!open && !dialogBusy) setConfirmKind(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("guestService.confirmWaiterTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("guestService.confirmWaiterDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dialogBusy}>{t("guestService.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={dialogBusy} onClick={() => void sendWaiterRequest()}>
              {dialogBusy && sending === "waiter" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("guestService.confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmKind === "bill"}
        onOpenChange={(open) => {
          if (!open && !dialogBusy) setConfirmKind(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("guestService.confirmBillTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("guestService.confirmBillDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dialogBusy}>{t("guestService.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={dialogBusy} onClick={() => void sendBillRequest()}>
              {dialogBusy && sending === "bill" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("guestService.confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ServiceActionButton({
  emoji,
  icon: Icon,
  label,
  sub,
  disabled,
  loading,
  onClick,
}: {
  emoji: string
  icon: typeof HandPlatter
  label: string
  sub: string
  disabled: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-amber-100/80 bg-amber-50/60 opacity-70 dark:border-amber-900/20 dark:bg-neutral-900/50"
          : "border-amber-200 bg-white shadow-sm hover:border-amber-300 hover:bg-amber-50/50 dark:border-amber-900/40 dark:bg-neutral-900 dark:hover:border-amber-700/50",
      )}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/30">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-700 dark:text-amber-300" aria-hidden />
        ) : (
          emoji
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-950 dark:text-white">
          <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-amber-800/65 dark:text-amber-300/60">{sub}</span>
      </span>
    </button>
  )
}
