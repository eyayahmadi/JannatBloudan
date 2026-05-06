"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Facebook,
  Send,
  CheckCircle2,
  ChevronRight,
  Heart,
  MessageCircle,
} from "lucide-react"
import { SITE } from "@/lib/site-config"
import { useI18n } from "@/lib/i18n/context"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/menu", labelKey: "nav.menu", fallback: "Menu" },
  { href: "/delivery", labelKey: "nav.delivery", fallback: "Livraison" },
  { href: "/reservation", labelKey: "nav.reservation", fallback: "Réservation" },
  { href: "/events", labelKey: "nav.events", fallback: "Événements" },
] as const

const COMPANY_LINKS = [
  { href: "/#about", labelKey: "footer.about", fallback: "À propos" },
  { href: "/#contact", labelKey: "footer.contact", fallback: "Contact" },
  { href: "/account", labelKey: "client.mySpace", fallback: "Mon espace" },
  { href: "/login", labelKey: "client.signIn", fallback: "Connexion" },
] as const

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Confidentialité" },
  { href: "/legal/terms", label: "CGU" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/legal-notice", label: "Mentions légales" },
] as const

const SOCIAL_LINKS = [
  { href: SITE.contact.instagramUrl, label: "Instagram", icon: Instagram },
  { href: SITE.contact.facebookUrl, label: "Facebook", icon: Facebook },
] as const

export function SiteFooter() {
  const { t } = useI18n()
  const year = new Date().getFullYear()
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitted) return
    setSubmitting(true)
    // TODO: brancher sur l'API de newsletter quand disponible
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setSubmitted(true)
    setEmail("")
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-[color:var(--lux-gold)]/25 text-amber-50">
      {/* Fond luxe avec dégradé + motif syrien subtil */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, var(--lux-charcoal) 0%, var(--lux-ink) 55%, #2b1d12 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--lux-gold)]/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 syrian-pattern opacity-[0.07]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-[color:var(--lux-gold)]/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[color:var(--lux-bordeaux)]/30 blur-[140px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        {/* Section principale : 4 colonnes */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand + description */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-[0_10px_30px_-12px_rgba(201,162,76,0.5)] ring-2 ring-[color:var(--lux-gold)]/40"
                style={{ background: "var(--lux-gradient-ink)" }}
              >
                <BloudanLogoMark withPhotoBack />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">
                  {SITE.name}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[color:var(--lux-gold-bright)]/85">
                  {SITE.tagline}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-amber-100/75">
              Cuisine syrienne authentique au cœur de Damas-sur-Seine. Mezze, grillades,
              douceurs orientales — pensés et préparés avec soin par notre équipe.
            </p>

            {/* Réseaux sociaux */}
            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--lux-gold-bright)]/80">
                {t("footer.followUs", "Suivez-nous")}
              </p>
              <div className="flex items-center gap-2.5">
                {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-[color:var(--lux-gold)]/60 hover:bg-[color:var(--lux-gold)]/15"
                  >
                    <Icon className="h-4 w-4 text-amber-100 transition group-hover:text-[color:var(--lux-gold-bright)] group-hover:scale-110" />
                  </a>
                ))}
                <a
                  href={`mailto:${SITE.contact.email}`}
                  aria-label="Email"
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition hover:border-[color:var(--lux-gold)]/60 hover:bg-[color:var(--lux-gold)]/15"
                >
                  <Mail className="h-4 w-4 text-amber-100 transition group-hover:text-[color:var(--lux-gold-bright)] group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>

          {/* Liens rapides */}
          <div className="lg:col-span-2">
            <FooterColumnTitle>Découvrir</FooterColumnTitle>
            <ul className="space-y-2.5">
              {NAV_LINKS.map(({ href, labelKey, fallback }) => (
                <li key={href}>
                  <FooterLink href={href}>{t(labelKey, fallback)}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterColumnTitle>Maison</FooterColumnTitle>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map(({ href, labelKey, fallback }) => (
                <li key={href}>
                  <FooterLink href={href}>{t(labelKey, fallback)}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Newsletter */}
          <div className="lg:col-span-4">
            <FooterColumnTitle>{t("footer.contact", "Contact")}</FooterColumnTitle>
            <ul className="mb-6 space-y-3 text-sm text-amber-100/80">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-bright)]">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug">
                  {SITE.address.streetAddress}
                  <br />
                  {SITE.address.postalCode} {SITE.address.addressLocality}
                  <br />
                  <span className="text-amber-100/90">{SITE.address.addressRegion}</span>
                  <br />
                  <span className="text-amber-100/55">
                    {SITE.address.addressCountry === "DE" ? "Allemagne" : SITE.address.addressCountry}
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-bright)]">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <a
                  href={SITE.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[color:var(--lux-gold-bright)]"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-bright)]">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <a href={`tel:${SITE.contact.phoneE164}`} className="transition hover:text-[color:var(--lux-gold-bright)]">
                  {SITE.contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-bright)]">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <a
                  href={`mailto:${SITE.contact.email}`}
                  className="transition hover:text-[color:var(--lux-gold-bright)] break-all"
                >
                  {SITE.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--lux-gold)]/15 text-[color:var(--lux-gold-bright)]">
                  <Clock className="h-3.5 w-3.5" />
                </span>
                <span className="leading-snug text-sm">
                  <span className="font-medium text-amber-100/90">
                    {t("footer.hours", "Horaires")}
                  </span>
                  <span className="mt-1 block whitespace-pre-line text-amber-100/80">
                    {t(
                      "landing.footer.hoursCompact",
                      "Lun–jeu · dim : 10h – minuit\nVen–sam : 10h – 2h",
                    )}
                  </span>
                </span>
              </li>
            </ul>

            {/* Newsletter */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
            >
              <p className="mb-1 text-sm font-semibold text-white">Newsletter</p>
              <p className="mb-3 text-xs text-amber-100/65">
                Recevez nos actualités et offres privilégiées.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-100/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@exemple.com"
                    aria-label="Adresse email pour la newsletter"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] pl-9 pr-3 text-sm text-white placeholder:text-amber-100/40 focus:border-[color:var(--lux-gold)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)]/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || submitted}
                  aria-label="S'abonner à la newsletter"
                  className={cn(
                    "flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-[color:var(--lux-ink)] transition",
                    "shadow-[0_8px_22px_-10px_rgba(201,162,76,0.6)]",
                    "disabled:cursor-not-allowed disabled:opacity-70",
                  )}
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  {submitted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              {submitted ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Merci ! Votre inscription est confirmée.
                </p>
              ) : null}
            </form>
          </div>
        </div>

        {/* Hairline divider */}
        <div className="mt-12 hairline-gold" />

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-amber-100/55">
            © {year} {SITE.name}.{" "}
            <span className="hidden sm:inline">{t("footer.rights", "Tous droits réservés")}.</span>
            <span className="ml-1 inline-flex items-center gap-1 text-amber-100/45">
              Conçu avec <Heart className="h-3 w-3 text-[color:var(--lux-bordeaux)]" /> à Erfurt
            </span>
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-amber-100/55">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-[color:var(--lux-gold-bright)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--lux-gold-bright)]/85">
      {children}
    </h3>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-sm text-amber-100/75 transition hover:text-[color:var(--lux-gold-bright)]"
    >
      <ChevronRight className="h-3 w-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
      <span className="-ml-3 transition group-hover:ml-0">{children}</span>
    </Link>
  )
}
