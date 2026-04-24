"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AnimatePresence,
  motion,
  type Variants,
} from "framer-motion"
import {
  BellRing,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  CreditCard,
  HandPlatter,
  Receipt,
  UtensilsCrossed,
  Wifi,
} from "lucide-react"

import { PageShell } from "@/components/site/PageShell"
import { PremiumBackdrop } from "@/components/site/PremiumBackdrop"
import { useRealtimeOrders, type OrderStatus } from "@/lib/hooks/useRealtimeOrders"
import { useTableAlerts } from "@/lib/hooks/useTableAlerts"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  ready: "Prête",
  delivering: "En service",
  completed: "Terminée",
  cancelled: "Annulée",
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  received: "bg-sky-100 text-sky-800",
  preparing: "bg-amber-100 text-amber-900",
  ready: "bg-emerald-100 text-emerald-800",
  delivering: "bg-blue-100 text-blue-800",
  completed: "bg-stone-100 text-stone-700",
  cancelled: "bg-rose-100 text-rose-700",
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 22 },
  },
}

export default function TableLandingPage() {
  const { tableId } = useParams<{ tableId: string }>()
  const { orders } = useRealtimeOrders()
  const { raise, activeByTable } = useTableAlerts()
  const [toast, setToast] = useState<string | null>(null)

  const tableOrders = useMemo(
    () => orders.filter((o) => String(o.table_number) === String(tableId)),
    [orders, tableId],
  )
  const activeOrder = tableOrders.find(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  )
  const tableAlerts = activeByTable(String(tableId))

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function callServer() {
    raise({
      tableId: String(tableId),
      type: "call_server",
      message: `Table ${tableId} demande l'assistance du serveur`,
    })
    setToast("Le serveur est prévenu, il arrive 👋")
  }

  function requestBill() {
    raise({
      tableId: String(tableId),
      type: "request_bill",
      message: `Table ${tableId} demande l'addition`,
    })
    setToast("Votre addition est en cours de préparation 🧾")
  }

  type Action = {
    href?: string
    onClick?: () => void
    label: string
    sub: string
    icon: typeof UtensilsCrossed
    primary?: boolean
  }

  const actions: Action[] = [
    {
      href: `/table/${tableId}/menu`,
      label: "Voir le menu",
      sub: "Commander en libre-service",
      icon: UtensilsCrossed,
      primary: true,
    },
    {
      href: `/table/${tableId}/order${activeOrder ? `?oid=${activeOrder.id}` : ""}`,
      label: "Suivre ma commande",
      sub: activeOrder ? STATUS_LABEL[activeOrder.status] : "Aucune commande active",
      icon: ClipboardList,
    },
    {
      onClick: callServer,
      label: "Appeler le serveur",
      sub: "Demande d'assistance à la table",
      icon: HandPlatter,
    },
    {
      onClick: requestBill,
      label: "Demander l'addition",
      sub: "Le serveur vous apportera la note",
      icon: Receipt,
    },
    {
      href: `/table/${tableId}/bill`,
      label: "Payer maintenant",
      sub: "Carte bancaire / wallet",
      icon: CreditCard,
    },
  ]

  return (
    <PageShell className="relative overflow-hidden">
      <PremiumBackdrop />

      <div className="relative mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {/* Luxury welcome header */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7 overflow-hidden rounded-[28px] p-7 text-white shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, #2b241c 0%, #6e1d2b 55%, #8e6b1e 100%)",
            boxShadow: "0 30px 60px -20px rgba(110, 29, 43, 0.55)",
          }}
        >
          {/* shimmer overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 80% -20%, rgba(217,183,106,0.45), transparent 60%)",
            }}
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          <div className="relative flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -4, scale: 1.06 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
            >
              <UtensilsCrossed className="h-7 w-7" />
            </motion.div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-amber-100/80">
                Bienvenue
              </p>
              <p className="font-display text-3xl font-bold leading-none tracking-tight">
                Table <span className="text-gold">{tableId}</span>
              </p>
            </div>
            <motion.div
              className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Wifi className="h-3 w-3 text-emerald-300" />
              <span>Session active</span>
            </motion.div>
          </div>

          <p className="relative mt-5 text-sm leading-relaxed text-amber-50/90">
            Scannez, commandez, suivez votre repas et payez — sans bouger de votre
            table. Une expérience signature, toute en finesse.
          </p>

          {/* gold hairline */}
          <div
            className="relative mt-5 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #d9b76a 40%, #d9b76a 60%, transparent)",
              opacity: 0.5,
            }}
          />
        </motion.section>

        {/* Alerts */}
        <AnimatePresence>
          {tableAlerts.length > 0 && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 space-y-2 overflow-hidden"
            >
              {tableAlerts.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 shadow-sm backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  <BellRing className="h-4 w-4 text-amber-600" />
                  {a.type === "call_server"
                    ? "Un serveur a été appelé"
                    : "Addition demandée"}{" "}
                  • en attente
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active order summary */}
        <AnimatePresence>
          {activeOrder && (
            <motion.div
              key="active-order"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-5"
            >
              <Link
                href={`/table/${tableId}/order?oid=${activeOrder.id}`}
                className="premium-card group flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md"
                    style={{ background: "var(--lux-gradient-gold)" }}
                  >
                    <ChefHat className="h-5 w-5" />
                  </motion.div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-800/70 dark:text-amber-200/70">
                      Commande #{activeOrder.order_number}
                    </p>
                    <p className="font-display text-lg font-semibold text-amber-950 dark:text-amber-100">
                      {activeOrder.items.length} articles · {" "}
                      <span className="text-gold">
                        {activeOrder.total.toFixed(2)}€
                      </span>
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    STATUS_COLOR[activeOrder.status],
                  )}
                >
                  {STATUS_LABEL[activeOrder.status]}
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {actions.map((a, i) => {
            const Icon = a.icon
            const inner = (
              <>
                <motion.div
                  whileHover={{ rotate: -6, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 260 }}
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-sm",
                    a.primary
                      ? "text-white"
                      : "bg-[color-mix(in_srgb,var(--lux-gold)_15%,transparent)] text-amber-900 dark:text-amber-200",
                  )}
                  style={
                    a.primary
                      ? {
                          background: "var(--lux-gradient-gold)",
                          boxShadow: "0 8px 20px -8px rgba(201,162,76,0.7)",
                        }
                      : undefined
                  }
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <div className="leading-tight">
                  <p className="font-display text-base font-semibold text-amber-950 dark:text-amber-50">
                    {a.label}
                  </p>
                  <p className="text-xs text-amber-900/65 dark:text-amber-200/65">
                    {a.sub}
                  </p>
                </div>
              </>
            )

            const baseCls = cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all shimmer-gold",
              "border-[color-mix(in_srgb,var(--lux-gold)_20%,transparent)]",
              "bg-white/75 backdrop-blur-sm dark:bg-white/5",
              "hover:border-[color-mix(in_srgb,var(--lux-gold)_60%,transparent)]",
              a.primary &&
                "sm:col-span-2 border-[color-mix(in_srgb,var(--lux-gold)_50%,transparent)] bg-gradient-to-br from-[var(--lux-cream)] to-[var(--lux-sand)] dark:from-[var(--lux-ink)] dark:to-[color-mix(in_srgb,var(--lux-bordeaux)_30%,var(--lux-ink))]",
            )

            return (
              <motion.div key={i} variants={item} whileTap={{ scale: 0.97 }}>
                {a.href ? (
                  <Link href={a.href} className={baseCls}>
                    {inner}
                  </Link>
                ) : (
                  <button onClick={a.onClick} className={cn(baseCls, "w-full")}>
                    {inner}
                  </button>
                )}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footer signature */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-center text-[11px] uppercase tracking-[0.3em] text-amber-900/50 dark:text-amber-200/40"
        >
          — une expérience signature —
        </motion.p>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4"
            >
              <div
                className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #5c6b3a 0%, #3d4a22 100%)",
                  boxShadow: "0 15px 35px -10px rgba(92,107,58,0.5)",
                }}
              >
                <CheckCircle2 className="h-4 w-4" /> {toast}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}
