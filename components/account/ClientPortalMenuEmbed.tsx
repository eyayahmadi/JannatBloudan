"use client"

import { DigitalMenuExperience } from "@/components/menu/DigitalMenuExperience"
import { MenuCartProvider } from "@/contexts/MenuCartContext"

export function ClientPortalMenuEmbed() {
  return (
    <MenuCartProvider>
      <div className="max-h-[min(88vh,920px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-[color:var(--lux-bordeaux)]/10 bg-white/80 shadow-[var(--lux-shadow-soft)]">
        <div className="p-4 sm:p-6">
          <DigitalMenuExperience />
        </div>
      </div>
    </MenuCartProvider>
  )
}
