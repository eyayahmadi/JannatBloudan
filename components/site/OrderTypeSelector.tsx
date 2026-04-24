"use client"

import { QrCode, User, Monitor } from "lucide-react"

type OrderMode = "qr_self_service" | "server" | "pos"

type Props = {
  value: OrderMode
  onChange: (mode: OrderMode) => void
}

const modes = [
  { id: "qr_self_service" as const, label: "QR Code", icon: QrCode, desc: "Self-service client" },
  { id: "server" as const, label: "Serveur", icon: User, desc: "Prise de commande" },
  { id: "pos" as const, label: "Caisse", icon: Monitor, desc: "Point de vente" },
]

export function OrderTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {modes.map((mode) => {
        const Icon = mode.icon
        const active = value === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "border-amber-600 bg-amber-600 text-white shadow-md"
                : "border-amber-200/60 bg-white/80 text-amber-900 hover:border-amber-400 dark:border-white/15 dark:bg-white/5 dark:text-amber-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <div className="text-left">
              <div>{mode.label}</div>
              <div className={`text-[10px] ${active ? "text-amber-100" : "text-amber-700/60 dark:text-amber-400/60"}`}>
                {mode.desc}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
