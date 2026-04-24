import type { ReactNode } from "react"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"

type AccountSubLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
  /** Image d’en-tête (défaut : salle) */
  heroImage?: string
}

export function AccountSubLayout({
  title,
  subtitle,
  children,
  heroImage = SITE.images.dining,
}: AccountSubLayoutProps) {
  return (
    <PageShell>
      <SiteHeader backHref="/account" backLabel="Compte" />
      <PageHero
        imageSrc={heroImage}
        imageAlt=""
        kicker="Espace personnel"
        title={title}
        subtitle={subtitle}
        height="sm"
      />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</div>
      <SiteFooter />
    </PageShell>
  )
}
