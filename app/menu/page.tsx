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
      <PageShell stableViewport contentClassName="pb-20 lg:pb-0">
        <SiteHeader backHref="/" />
        <PageHero
          imageSrc={SITE.images.mezze}
          imageAlt="Mezzés syriens — la carte de Jannat Bloudan"
          kicker="Notre carte"
          title="Menu"
          subtitle="Syrisch-libanesische Küche in Bloudan — Entrées, Grillades, Shawarma, Pizza, Desserts, Getränke & Shisha."
          height="sm"
        />
        <div className="flex-1 py-8">
          <DigitalMenuExperience />
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </PageShell>
    </MenuCartProvider>
  )
}
