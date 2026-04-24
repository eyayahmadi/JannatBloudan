"use client"

import { MenuOnlyGrid } from "@/frontend/src/modules/menu/components/MenuOnlyGrid"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"

export default function MenuOnlyPage() {
  const restaurantId = "demo-restaurant-id"

  return (
    <PageShell>
      <SiteHeader backHref="/" />
      <PageHero
        imageSrc={SITE.images.mezze}
        imageAlt="Sélection du chef"
        kicker="La carte"
        title="Menu"
        subtitle="Mezzés, four et traditions — une lecture simple, des saveurs nettes."
        height="sm"
      />
      <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8 animate-fade-up">
        <MenuOnlyGrid restaurantId={restaurantId} />
      </div>
      <SiteFooter />
    </PageShell>
  )
}
