import type { ReactNode } from "react"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SITE } from "@/lib/site-config"

type AdminPageFrameProps = {
  title: string
  subtitle?: string
  children: ReactNode
  trailing?: ReactNode
}

export function AdminPageFrame({ title, subtitle, children, trailing }: AdminPageFrameProps) {
  return (
    <PageShell>
      <SiteHeader backHref="/admin" backLabel="Dashboard" hideMainNav trailing={trailing} />
      <PageHero
        imageSrc={SITE.images.interior}
        imageAlt=""
        kicker="Administration"
        title={title}
        subtitle={subtitle}
        height="sm"
      />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      <SiteFooter />
    </PageShell>
  )
}
