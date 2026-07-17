"use client"

import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { SITE } from "@/lib/site-config"
import { PublicMenuExperience } from "@/components/menu/public/PublicMenuExperience"
import { MenuCartProvider } from "@/contexts/MenuCartContext"
import { useI18n } from "@/lib/i18n/context"

/**
 * Public website menu — opened from View Menu / Menü ansehen / Voir le menu.
 * Uses full site chrome; independent from the QR table menu layout.
 */
export function PublicMenuPage() {
  const { t } = useI18n()

  return (
    <MenuCartProvider>
      <PageShell stableViewport contentClassName="pb-20 lg:pb-0">
        <SiteHeader backHref="/" />
        <PageHero
          imageSrc={SITE.images.mezze}
          imageAlt="Mezzés syriens — la carte de Jannat Bloudan"
          kicker={t("nav.menu")}
          title={t("menu.menuTitle")}
          subtitle={t("menu.publicHeroSubtitle")}
          height="sm"
        />
        <div className="flex-1 py-8">
          <PublicMenuExperience />
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </PageShell>
    </MenuCartProvider>
  )
}
