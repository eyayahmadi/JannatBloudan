"use client"

import type { ReactNode } from "react"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { useAdminPortalOptional } from "@/components/admin/admin-portal-context"
import { SITE } from "@/lib/site-config"

type AdminPageFrameProps = {
  title: string
  subtitle?: string
  children: ReactNode
  trailing?: ReactNode
}

export function AdminPageFrame({ title, subtitle, children, trailing }: AdminPageFrameProps) {
  const portal = useAdminPortalOptional()

  if (portal?.suppressPageChrome) {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="flex flex-col gap-3 border-b border-[color:var(--lux-bordeaux)]/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900/45">Module</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-amber-950 dark:text-amber-50">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-amber-900/65 dark:text-amber-200/65">{subtitle}</p> : null}
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        {children}
      </div>
    )
  }

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
