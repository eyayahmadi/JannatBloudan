"use client"

import { useEffect, useState } from "react"
import { HandPlatter, Receipt } from "lucide-react"
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

export function OrderServiceActions({ tableNumber, orderNumber, className }: OrderServiceActionsProps) {
  const { t } = useI18n()
  const { raise, activeByTable } = useTableAlerts()
  const [confirmKind, setConfirmKind] = useState<PendingKind>(null)
  const [toast, setToast] = useState<string | null>(null)

  const tableKey = String(tableNumber)
  const tableAlerts = activeByTable(tableKey)
  const waiterPending = tableAlerts.some((a) => a.type === "call_server")
  const billPending = tableAlerts.some((a) => a.type === "request_bill")

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const sendWaiterRequest = () => {
    raise({
      tableId: tableKey,
      type: "call_server",
      message: buildGuestServiceAlertMessage({
        kind: "waiter",
        tableNumber,
        orderNumber,
      }),
    })
    setToast(t("guestService.toastWaiter"))
    setConfirmKind(null)
  }

  const sendBillRequest = () => {
    raise({
      tableId: tableKey,
      type: "request_bill",
      message: buildGuestServiceAlertMessage({
        kind: "bill",
        tableNumber,
        orderNumber,
      }),
    })
    setToast(t("guestService.toastBill"))
    setConfirmKind(null)
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2",
          className,
        )}
      >
        <ServiceActionButton
          emoji="👨‍🍳"
          icon={HandPlatter}
          label={t("guestService.requestWaiter")}
          sub={waiterPending ? t("guestService.pendingWaiter") : t("guestService.requestWaiterSub")}
          disabled={waiterPending}
          onClick={() => setConfirmKind("waiter")}
        />
        <ServiceActionButton
          emoji="💳"
          icon={Receipt}
          label={t("guestService.requestBill")}
          sub={billPending ? t("guestService.pendingBill") : t("guestService.requestBillSub")}
          disabled={billPending}
          onClick={() => setConfirmKind("bill")}
        />
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[120] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-200/80 bg-white px-5 py-3 text-center text-sm font-medium text-amber-950 shadow-lg dark:border-amber-800/50 dark:bg-neutral-900 dark:text-amber-100"
        >
          {toast}
        </div>
      ) : null}

      <AlertDialog open={confirmKind === "waiter"} onOpenChange={(open) => !open && setConfirmKind(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("guestService.confirmWaiterTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("guestService.confirmWaiterDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("guestService.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={sendWaiterRequest}>{t("guestService.confirmSend")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmKind === "bill"} onOpenChange={(open) => !open && setConfirmKind(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("guestService.confirmBillTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("guestService.confirmBillDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("guestService.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={sendBillRequest}>{t("guestService.confirmSend")}</AlertDialogAction>
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
  onClick,
}: {
  emoji: string
  icon: typeof HandPlatter
  label: string
  sub: string
  disabled: boolean
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
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-900/30">
        {emoji}
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
