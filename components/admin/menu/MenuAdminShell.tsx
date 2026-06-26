"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/admin/menu/products", label: "Produkte", icon: "🍽️" },
  { href: "/admin/menu/categories", label: "Kategorien", icon: "📂" },
  { href: "/admin/menu/extras", label: "Extras", icon: "✨" },
  { href: "/admin/menu/variants", label: "Varianten", icon: "📐" },
  { href: "/admin/menu/recommendations", label: "Empfehlungen", icon: "💡" },
] as const

export function MenuAdminShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700/70">Menu Management</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title ?? "Jannat Bloudan Menu"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Speisekarte, Preise, Bilder, Varianten und Empfehlungen — live im QR-Menü.
        </p>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-amber-600 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              )}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
