"use client"

import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { SITE } from "@/lib/site-config"
import { DigitalMenuExperience } from "@/components/menu/DigitalMenuExperience"
import { MenuCartProvider } from "@/contexts/MenuCartContext"

export default function MenuOnlyPage() {
  return (
    <MenuCartProvider>
      <PageShell contentClassName="pb-20 lg:pb-0">
        <SiteHeader backHref="/" />
        <PageHero
          imageSrc={SITE.images.mezze}
          imageAlt="Mezzés syriens — la carte de Jannat Bloudan"
          kicker="Notre carte"
          title="Menu"
          subtitle="Mezzes, grillades, manakish, desserts orientaux — préparés chaque jour avec des ingrédients frais."
          height="sm"
        />
        <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <DigitalMenuExperience />
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </PageShell>
    </MenuCartProvider>
  )
}
