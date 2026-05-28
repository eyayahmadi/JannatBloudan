"use client"

import Link from "next/link"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Award,
  Baby,
  Cake,
  Calendar,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Gamepad2,
  Heart,
  Leaf,
  MapPin,
  Palette,
  Phone as PhoneIcon,
  Quote,
  Shield,
  Sparkles,
  Star,
  Truck,
  Users,
  Wine,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react"
import { PublicHeader } from "@/components/site/PublicHeader"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { ScrollToTop } from "@/components/site/ScrollToTop"
import { Button } from "@/components/ui/button"
import { ChatWidget } from "@/components/chat/ChatWidget"
import { cn } from "@/lib/utils"
import { SITE } from "@/lib/site-config"
import { useI18n } from "@/lib/i18n/context"

/* -------------------------------------------------------------------------- */
/*  Animation presets                                                         */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.2, 0.8, 0.2, 1] } },
}
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] } },
}

/** Versions allégées lorsque prefers-reduced-motion est actif. */
const fadeUpReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
}
const fadeInReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
}
const scaleInReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
}
const staggerReduced: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
}

type RevealVariants = {
  fadeUp: Variants
  fadeIn: Variants
  scaleIn: Variants
  stagger: Variants
}

function buildRevealVariants(reducedMotion: boolean): RevealVariants {
  if (!reducedMotion)
    return { fadeUp, fadeIn, scaleIn, stagger }
  return {
    fadeUp: fadeUpReduced,
    fadeIn: fadeInReduced,
    scaleIn: scaleInReduced,
    stagger: staggerReduced,
  }
}

const LandingRevealCtx = createContext<RevealVariants>(buildRevealVariants(false))

function useReveal() {
  return useContext(LandingRevealCtx)
}

function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const { stagger: staggerReveal } = useReveal()
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerReveal}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const LANDING_PHOTO =
  "h-full w-full min-h-0 object-cover object-center [filter:brightness(1.06)_contrast(1.04)_saturate(1.04)]"

const CUISINE_ORDER = ["mezze", "grillades", "desserts", "boissons", "chicha"] as const
const CUISINE_ICONS: Record<(typeof CUISINE_ORDER)[number], LucideIcon> = {
  mezze: Leaf,
  grillades: Flame,
  desserts: Heart,
  boissons: Wine,
  chicha: Sparkles,
}
const CUISINE_IMGS: Record<(typeof CUISINE_ORDER)[number], string> = {
  mezze: "/images/syrian-mezze-table-spread.png",
  grillades: "/images/syrian-mandi-lamb-rice-platter.png",
  desserts: "/images/dessert-booza-rolls-pistachio.png",
  boissons: "/images/drinks-smoothies-variety.png",
  chicha: "/images/shisha-lounge-candles.png",
}

const POPULAR_ORDER = ["d1", "d2", "d3", "d4"] as const
const POPULAR_IMGS: Record<(typeof POPULAR_ORDER)[number], string> = {
  d1: "/images/syrian-mandi-lamb-rice-platter.png",
  d2: "/images/western-burger-mix-fries.png",
  d3: "/images/syrian-mezze-manakish-hummus.png",
  d4: "/images/dessert-crepes-chocolate-strawberry.png",
}

const WHY_ICONS = [Truck, Leaf, ChefHat, Shield] as const

/**
 * Visuels événements — Unsplash (mariages, anniversaires, soirées privées).
 * Ces photos restent jusqu'à ce que les vraies photos du restaurant soient
 * fournies (à déposer dans /public/images puis remplacer ces URLs).
 */
const EVENT_IMGS = [
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=90",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=90",
] as const

/**
 * Visuel "Jannat livré chez vous" — photo locale de grillade mixte syrienne
 * (déjà utilisée par /app/delivery/page.tsx).
 */
const DELIVERY_IMG = "/mixed-shawarma-syrian-style.jpg"

/**
 * Section "Experience" — moments familiaux & hospitalité syrienne au resto.
 * Photos locales fournies par le client (haute qualité, vraie ambiance Jannat) :
 * - restaurant : main offrant une assiette de kibbeh — geste d'hospitalité syrienne
 * - family    : grande tablée de mezzés avec lanternes — repas familial festif
 * Les `<img>` ont un fallback `onError` vers une autre image locale par sécurité.
 */
const EXPERIENCE_IMGS = {
  restaurant: "/images/jannat-syrian-hospitality-kibbeh.png",
  family: "/images/jannat-arab-feast-lantern-table.png",
} as const

const EXPERIENCE_FALLBACK = {
  restaurant: "/images/syrian-mandi-lamb-rice-platter.png",
  family: "/images/syrian-mezze-table-spread.png",
} as const

/**
 * Espace familles & enfants — visuels locaux d'enfants/familles.
 * - hero  : moment complice mère & enfant partageant un milkshake au restaurant
 * - play  : enfants qui dansent dans une salle de jeux colorée (aire de jeux)
 * - art   : main d'enfant peinte de couleurs vives (activité créative)
 * `onError` retombe sur l'image "art" pour rester dans le thème enfants.
 */
const FAMILY_KIDS_IMGS = {
  hero: "/images/family-mother-son-milkshake-restaurant.png",
  play: "/images/kids-dancing-playroom-balloons.png",
  art: "/images/kids-painted-rainbow-hand.png",
} as const

const FAMILY_KIDS_FALLBACK = "/images/kids-painted-rainbow-hand.png"

const STORY_IMGS = {
  /** Syrie — livre-sculpture 3D évoquant les monuments syriens (Palmyre, mosquée, citadelle) */
  syria: "/images/syria-history-book-3d.png",
  /** Bloudan (Syrie) — vue sur la vallée & les montagnes, atmosphère source du nom Jannat */
  bloudan: "/images/bloudan-panorama.png",
} as const

/**
 * Slider "atmosphère" — séquence narrative cinématographique :
 *   Syrie → Food → Dessert → Drinks → Bloudan → Chicha → (loop)
 * Une seule image visible à la fois, fondu enchaîné + léger Ken Burns.
 */
const GALLERY: readonly string[] = [
  "/images/syria-umayyad-square-night.png",
  "/images/syrian-mezze-tabbouleh-falafel-dolma.png",
  "/images/dessert-booza-stretch-pistachio.png",
  "/images/drinks-strawberry-milkshakes.png",
  "/images/bloudan-winter-mountains.png",
  "/images/shisha-lounge-neon.png",
] as const

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion() === true
  const revealVariants = useMemo(() => buildRevealVariants(prefersReducedMotion), [prefersReducedMotion])

  return (
    <LandingRevealCtx.Provider value={revealVariants}>
    <div className="relative min-h-screen overflow-x-hidden pb-20 lg:pb-0" style={{ background: "var(--lux-gradient-paper)" }}>
      <PublicHeader />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <StatsStrip />
        <StoryBloudan />
        <CuisineSection />
        <PopularDishes />
        <MenuPreview />
        <WhyOrder />
        <Experience />
        <FamilyKidsSection />
        <ReservationCTA />
        <EventsSection />
        <DeliverySection />
        <Reviews />
        <Gallery />
        <Contact />
      </main>
      <FooterElegant />

      <ChatWidget />
      <ScrollToTop position="bottom-left" />
      <MobileBottomNav />
    </div>
    </LandingRevealCtx.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  const { t } = useI18n()
  const reduceHero = useReducedMotion() === true
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduceHero ? 0 : 140])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduceHero ? 1 : 0.2])
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduceHero ? 1 : 1.08])

  return (
    <section ref={ref} className="relative min-h-[92vh] w-full overflow-hidden">
      {/* Background image with parallax + zoom */}
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        <img
          src="/images/syria-damascus-night-skyline.png"
          alt={t("landing.hero.imageAlt")}
          className="h-full w-full object-cover [filter:brightness(1.08)_contrast(1.05)_saturate(1.05)]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,20,16,0.38) 0%, rgba(74,15,28,0.28) 48%, rgba(26,20,16,0.55) 100%)",
          }}
        />
        {/* Decorative gold dust */}
        <div
          className="absolute inset-0 opacity-16 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(217,183,106,0.2), transparent 40%), radial-gradient(circle at 80% 70%, rgba(217,183,106,0.16), transparent 45%)",
          }}
        />
      </motion.div>

      <motion.div style={{ opacity }} className="site-container relative z-10 flex min-h-[92vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: reduceHero ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceHero ? 0.2 : 0.8, delay: reduceHero ? 0 : 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--lux-sand)] backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--lux-gold-bright)]" />
          {t("landing.hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: reduceHero ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceHero ? 0.22 : 1,
            delay: reduceHero ? 0 : 0.25,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="max-w-5xl text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className="text-white/95">{t("landing.hero.titleLine1")}</span>
          <span
            className="italic"
            style={{
              backgroundImage: "var(--lux-gradient-gold)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("landing.hero.titleLine2")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: reduceHero ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceHero ? 0.2 : 0.8, delay: reduceHero ? 0 : 0.5 }}
          className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-white/90 sm:text-xl"
        >
          {t("landing.hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: reduceHero ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceHero ? 0.2 : 0.8, delay: reduceHero ? 0 : 0.7 }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
        >
          <PrimaryCTA href="/delivery" icon={<Truck className="h-5 w-5" />}>
            {t("landing.hero.ctaOrder")}
          </PrimaryCTA>
          <GhostCTA href="/menu">{t("landing.hero.ctaMenu")}</GhostCTA>
          <GhostCTA href="/reservation" variant="solid">
            {t("landing.hero.ctaReserve")}
          </GhostCTA>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceHero ? 0.2 : 1.4, delay: reduceHero ? 0 : 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          {reduceHero ? (
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/40 p-1.5 opacity-80">
              <div
                className="h-2 w-1 rounded-full"
                style={{ background: "var(--lux-gradient-gold)" }}
              />
            </div>
          ) : (
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-10 w-6 items-start justify-center rounded-full border border-white/40 p-1.5"
            >
              <div
                className="h-2 w-1 rounded-full"
                style={{ background: "var(--lux-gradient-gold)" }}
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  )
}

function PrimaryCTA({
  href,
  icon,
  children,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      variant="gold"
      size="hero"
      className="group relative w-fit max-w-full overflow-hidden pl-8 pr-7"
    >
      <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-bordeaux)]/30">
        {icon}
        <span className="relative z-10">{children}</span>
        <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition-[transform] duration-[1150ms] ease-out motion-reduce:duration-0 motion-reduce:transition-none group-hover:translate-x-[120%] motion-reduce:group-hover:translate-x-[-120%]"
        />
      </Link>
    </Button>
  )
}

function GhostCTA({
  href,
  children,
  variant = "ghost",
}: {
  href: string
  children: React.ReactNode
  variant?: "ghost" | "solid"
}) {
  return (
    <Button
      asChild
      variant={variant === "ghost" ? "heroGlass" : "default"}
      size="hero"
      className={cn("w-fit max-w-full", variant === "solid" && "shadow-xl")}
    >
      <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-white/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-bordeaux)]/20">
        {children}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stats strip                                                               */
/* -------------------------------------------------------------------------- */

function StatsStrip() {
  const { t } = useI18n()
  const { fadeUp, stagger } = useReveal()
  const preferReducedMotion = useReducedMotion() === true
  const stats = [
    { icon: Star, value: t("landing.stats.s1"), label: t("landing.stats.l1") },
    { icon: Clock, value: t("landing.stats.s2"), label: t("landing.stats.l2") },
    { icon: Award, value: t("landing.stats.s3"), label: t("landing.stats.l3") },
    { icon: Users, value: t("landing.stats.s4"), label: t("landing.stats.l4") },
  ] as const
  return (
    <Section className="border-b border-[color:var(--lux-gold)]/20 py-8 sm:py-10">
      <div className="site-container">
        <motion.div variants={stagger} className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={preferReducedMotion ? undefined : { y: -4 }}
                className="flex items-center gap-4"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[color:var(--lux-ink)] shadow-[0_10px_30px_-14px_rgba(201,162,76,0.55)]"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="numeric-display text-2xl font-bold text-amber-950 sm:text-3xl">{s.value}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-800/70">{s.label}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Histoire de Bloudan                                                       */
/* -------------------------------------------------------------------------- */

function StoryBloudan() {
  const { t } = useI18n()
  const { fadeUp, fadeIn } = useReveal()
  const preferReducedMotion = useReducedMotion() === true
  const bloudanQuote = t("landing.bloudan.quote").trim()
  return (
    <Section id="about" className="py-28 sm:py-36">
      <div className="site-container space-y-24 lg:space-y-32">
        {/* La Syrie */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div variants={fadeUp} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.syria.kicker")}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
              {t("landing.syria.titleA")}
              <span className="text-gold italic">{t("landing.syria.titleEm")}</span>
            </h2>
            <div className="hairline-gold my-8" />
            <div className="space-y-5 text-base leading-relaxed text-amber-900/90 sm:text-lg">
              <p>{t("landing.syria.p1")}</p>
              <p>{t("landing.syria.p2")}</p>
            </div>
          </motion.div>
          <motion.div variants={fadeIn} className="relative w-full min-w-0">
            {/* Natural image ratio — no fixed aspect box (avoids beige band below image). */}
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_32px_64px_-28px_rgba(74,15,28,0.35)] ring-1 ring-amber-900/[0.06]">
              <motion.img
                whileHover={preferReducedMotion ? undefined : { scale: 1.06 }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                src={STORY_IMGS.syria}
                alt={t("landing.syria.imageAlt")}
                className="block h-auto w-full object-cover object-center [filter:brightness(1.06)_contrast(1.04)_saturate(1.04)]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-950/12 via-transparent to-white/[0.06]" />
            </div>
            <div
              className="pointer-events-none absolute -inset-[10px] -z-10 rounded-[calc(2rem+10px)] border-2"
              style={{ borderColor: "color-mix(in srgb, var(--lux-gold) 45%, transparent)" }}
              aria-hidden
            />
          </motion.div>
        </div>

        {/* Bloudan — origine du nom */}
        <div className="grid grid-cols-1 items-center gap-12 pb-40 lg:grid-cols-2 lg:gap-16 lg:pb-32">
          <motion.div variants={fadeIn} className="relative order-2 min-w-0 lg:order-1">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_32px_64px_-28px_rgba(74,15,28,0.35)]">
              <motion.img
                whileHover={preferReducedMotion ? undefined : { scale: 1.06 }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                src={STORY_IMGS.bloudan}
                alt={t("landing.bloudan.imageAlt")}
                className={cn(LANDING_PHOTO)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/14 via-transparent to-white/[0.06]" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute -bottom-6 -right-4 max-w-[240px] rounded-2xl bg-white p-5 shadow-[0_24px_60px_-22px_rgba(26,20,16,0.4)] sm:-right-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--lux-gold-deep)]">
                {t("landing.bloudan.cardKicker")}
              </p>
              <p className="mt-2 font-display text-lg font-semibold text-amber-950">
                {t("landing.bloudan.cardTitle")}
              </p>
            </motion.div>
            <div
              className="absolute -left-4 -top-4 -z-10 h-full w-full rounded-[2rem] border-2"
              style={{ borderColor: "color-mix(in srgb, var(--lux-gold) 45%, transparent)" }}
              aria-hidden
            />
          </motion.div>
          <motion.div variants={fadeUp} className="order-1 min-w-0 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.bloudan.kicker")}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
              {t("landing.bloudan.titleA")}
              <span className="text-gold italic">{t("landing.bloudan.titleEm")}</span>
              {t("landing.bloudan.titleC")}
            </h2>
            <div className="hairline-gold my-8" />
            <div className="space-y-5 text-base leading-relaxed text-amber-900/90 sm:text-lg">
              <p>{t("landing.bloudan.p1")}</p>
              <p>{t("landing.bloudan.p2")}</p>
              <p>{t("landing.bloudan.p3")}</p>
              {bloudanQuote ? (
                <p className="border-l-2 border-[color:var(--lux-gold)]/50 pl-4 italic text-[color:var(--lux-bordeaux)]">
                  {t("landing.bloudan.quote")}
                </p>
              ) : null}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild variant="luxPanel" size="panel">
                <Link href="/menu">
                  {t("landing.bloudan.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Cuisine syrienne                                                          */
/* -------------------------------------------------------------------------- */

function CuisineSection() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, stagger, scaleIn } = useReveal()
  return (
    <Section className="py-28 sm:py-36" id="cuisine">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.cuisine.kicker")}
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.cuisine.titleA")}
            <span className="text-gold italic">{t("landing.cuisine.titleEm")}</span>
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-amber-900/85 sm:text-[1.05rem]">
            {t("landing.cuisine.lead")}
          </p>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CUISINE_ORDER.map((id) => {
            const Icon = CUISINE_ICONS[id]
            const title = t(`landing.cuisine.${id}.title`)
            const desc = t(`landing.cuisine.${id}.desc`)
            return (
              <motion.div
                key={id}
                variants={scaleIn}
                whileHover={preferReducedMotion ? undefined : { y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_50px_-24px_rgba(74,15,28,0.35)] ring-1 ring-[color:var(--lux-gold)]/15"
              >
                <div className="relative h-56 overflow-hidden bg-amber-50">
                  <motion.img
                    src={CUISINE_IMGS[id]}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover object-center [filter:brightness(1.06)_contrast(1.04)_saturate(1.04)]"
                    whileHover={preferReducedMotion ? undefined : { scale: 1.08 }}
                    transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-950/25 to-transparent" />
                  <div
                    className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--lux-ink)] shadow-md"
                    style={{ background: "var(--lux-gradient-gold)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-2xl font-semibold text-amber-950">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-amber-900/80">{desc}</p>
                  <Button
                    asChild
                    variant="link"
                    size="sm"
                    className="mt-4 inline-flex w-fit gap-1 font-semibold !no-underline text-[color:var(--lux-bordeaux)] hover:!no-underline"
                  >
                    <Link href="/menu">
                      {t("landing.cuisine.seeMenu")} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-16 max-w-3xl text-center text-pretty text-base leading-relaxed text-amber-900/88 sm:text-lg"
        >
          {t("landing.cuisine.boissonsDessertsChicha")}
        </motion.p>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Plats populaires                                                          */
/* -------------------------------------------------------------------------- */

function PopularDishes() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, stagger } = useReveal()
  return (
    <Section className="relative py-28 sm:py-36" id="popular">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--lux-gold), transparent)" }}
      />
      <div className="site-container">
        <motion.div variants={fadeUp} className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.popular.kicker")}
            </p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
              {t("landing.popular.titleA")}<span className="text-gold italic">{t("landing.popular.titleEm")}</span>
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-amber-900/85 sm:text-lg">
              {t("landing.popular.lead")}
            </p>
          </div>
          <div className="shrink-0 md:pt-8">
            <Button
              asChild
              variant="link"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold !no-underline text-amber-950 transition hover:gap-3 hover:!no-underline"
              size="sm"
            >
              <Link href="/menu">
                {t("landing.popular.explore")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_ORDER.map((key) => {
            const d = {
              name: t(`landing.popular.${key}.name`),
              desc: t(`landing.popular.${key}.desc`),
              price: t(`landing.popular.${key}.price`),
              tag: t(`landing.popular.${key}.tag`),
              img: POPULAR_IMGS[key],
            }
            return (
            <motion.div
              key={key}
              variants={fadeUp}
              whileHover={preferReducedMotion ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="premium-card group flex flex-col overflow-hidden p-0"
            >
              <div className="relative h-52 overflow-hidden">
                <motion.img
                  src={d.img}
                  alt={d.name}
                  className={LANDING_PHOTO}
                  whileHover={preferReducedMotion ? undefined : { scale: 1.08 }}
                  transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                />
                <span
                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--lux-ink)] shadow"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  {d.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-semibold text-amber-950">{d.name}</h3>
                <p className="mt-2 flex-1 text-sm text-amber-900/80">{d.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="numeric-display text-2xl font-bold text-[color:var(--lux-bordeaux)]">
                    {d.price}
                  </span>
                  <Button
                    asChild
                    variant="gold"
                    size="chip"
                    className="hover:scale-[1.04] motion-reduce:hover:scale-100"
                  >
                    <Link href="/delivery">{t("landing.popular.add")}</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Menu preview (marquee categorie)                                          */
/* -------------------------------------------------------------------------- */

function MenuPreview() {
  const { t } = useI18n()
  const reducedMotionMarquee = useReducedMotion() === true
  const { fadeUp } = useReveal()
  const categories = Array.from({ length: 8 }, (_, i) => t(`landing.menuPreview.cat${i}`))
  return (
    <Section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, transparent, rgba(242,233,215,0.4), transparent)" }}
      />
      <div className="site-container">
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <h3 className="font-display text-3xl font-semibold text-amber-950 sm:text-4xl">
            {t("landing.menuPreview.titleBefore")}
            <span className="text-gold italic">{t("landing.menuPreview.titleEm")}</span>
            {t("landing.menuPreview.titleAfter")}
          </h3>
        </motion.div>
      </div>
      <div className="relative flex overflow-hidden">
        {reducedMotionMarquee ? (
          <div className="site-container flex flex-wrap justify-center gap-3">
            {categories.map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="whitespace-nowrap rounded-full border border-[color:var(--lux-gold)]/40 bg-white/80 px-6 py-3 font-display text-lg text-amber-950 shadow-sm backdrop-blur-md"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="flex shrink-0 gap-4 pr-4"
          >
            {[...categories, ...categories].map((c, i) => (
              <span
                key={i}
                className="whitespace-nowrap rounded-full border border-[color:var(--lux-gold)]/40 bg-white/80 px-6 py-3 font-display text-lg text-amber-950 shadow-sm backdrop-blur-md"
              >
                {c}
              </span>
            ))}
          </motion.div>
        )}
      </div>
      <div className="mt-12 flex justify-center">
        <Button asChild variant="luxPanel" size="panel" className="px-8 py-3.5">
          <Link href="/menu">
            {t("landing.menuPreview.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pourquoi commander                                                        */
/* -------------------------------------------------------------------------- */

function WhyOrder() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, stagger } = useReveal()
  const keys = ["r1", "r2", "r3", "r4"] as const
  return (
    <Section className="py-28 sm:py-36">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.why.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.why.titleA")}<span className="text-gold italic">{t("landing.why.titleEm")}</span>
          </h2>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {keys.map((k, idx) => {
            const Icon = WHY_ICONS[idx]
            const title = t(`landing.why.${k}.title`)
            const desc = t(`landing.why.${k}.desc`)
            return (
              <motion.div
                key={k}
                variants={fadeUp}
                whileHover={preferReducedMotion ? undefined : { y: -6 }}
                className="premium-card shimmer-gold group relative h-full p-7 text-center"
              >
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-[color:var(--lux-ink)] shadow-[0_14px_34px_-16px_rgba(201,162,76,0.6)]"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-semibold text-amber-950">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-900/80">{desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Expérience restaurant                                                     */
/* -------------------------------------------------------------------------- */

function Experience() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, fadeIn, stagger } = useReveal()
  const bullets = [t("landing.experience.b1"), t("landing.experience.b2"), t("landing.experience.b3"), t("landing.experience.b4")]
  return (
    <Section className="relative overflow-hidden py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[88%] max-h-[900px] -translate-y-1/2 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 72% 55% at 50% 50%, rgba(201,162,76,0.09), transparent 62%), radial-gradient(ellipse 50% 38% at 50% 18%, rgba(110,29,43,0.045), transparent 55%)",
        }}
      />
      <div className="relative site-container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visuel — carte flottante, centré avec le bloc texte */}
          <motion.div
            variants={fadeIn}
            className="relative order-2 flex min-w-0 w-full justify-center lg:order-1"
          >
            <div
              className={cn(
                "relative w-full rounded-[26px] bg-gradient-to-b from-white/40 via-white/[0.12] to-transparent p-3 shadow-[0_32px_80px_-34px_rgba(74,15,28,0.42),0_18px_48px_-28px_rgba(26,20,16,0.22)] backdrop-blur-[2px] ring-1 ring-amber-900/[0.06] dark:from-white/[0.08] dark:ring-white/[0.08]",
                !preferReducedMotion && "translate-y-1.5 motion-reduce:translate-y-0",
              )}
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <motion.div
                  whileHover={preferReducedMotion ? undefined : { y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="relative aspect-[3/4] overflow-hidden rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-22px_rgba(74,15,28,0.38)]"
                >
                  <motion.img
                    src={EXPERIENCE_IMGS.restaurant}
                    alt={t("landing.experience.img1")}
                    className={LANDING_PHOTO}
                    whileHover={preferReducedMotion ? undefined : { scale: 1.05 }}
                    transition={{ duration: 1 }}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement
                      if (img.src !== window.location.origin + EXPERIENCE_FALLBACK.restaurant) {
                        img.src = EXPERIENCE_FALLBACK.restaurant
                      }
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35" />
                </motion.div>
                <motion.div
                  whileHover={preferReducedMotion ? undefined : { y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="relative mt-8 aspect-[3/4] overflow-hidden rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_20px_50px_-22px_rgba(74,15,28,0.38)] sm:mt-10"
                >
                  <motion.img
                    src={EXPERIENCE_IMGS.family}
                    alt={t("landing.experience.img2")}
                    className={LANDING_PHOTO}
                    whileHover={preferReducedMotion ? undefined : { scale: 1.05 }}
                    transition={{ duration: 1 }}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement
                      if (img.src !== window.location.origin + EXPERIENCE_FALLBACK.family) {
                        img.src = EXPERIENCE_FALLBACK.family
                      }
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Texte — même largeur cible pour équilibre visuel */}
          <motion.div
            variants={fadeUp}
            className="order-1 min-w-0 w-full text-center lg:order-2 lg:text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.experience.kicker")}
            </p>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.12] tracking-tight text-amber-950 sm:text-5xl lg:text-[2.85rem] lg:leading-[1.1]">
              {t("landing.experience.titleA")}<span className="text-gold italic">{t("landing.experience.titleEm")}</span>
            </h2>
            <div className="hairline-gold mx-auto my-8 lg:mx-0" />
            <p className="text-pretty text-[1.05rem] leading-[1.75] text-amber-900/[0.93] sm:text-lg sm:leading-[1.76]">
              {t("landing.experience.text")}
            </p>
            <motion.ul variants={stagger} className="mt-10 space-y-4 text-left">
              {bullets.map((line) => (
                <motion.li key={line} variants={fadeUp} className="flex items-start gap-3.5 text-sm leading-relaxed text-amber-950 sm:text-[0.965rem] sm:leading-[1.7]">
                  <span
                    className="mt-[0.35rem] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-sm"
                    style={{ background: "var(--lux-gradient-gold)" }}
                  >
                    <svg className="h-3 w-3 text-[color:var(--lux-ink)]" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{line}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Espace familles & enfants — jeux et activités                             */
/* -------------------------------------------------------------------------- */

const FAMILY_FEATURES = ["f1", "f2", "f3", "f4"] as const
const FAMILY_ICONS: Record<(typeof FAMILY_FEATURES)[number], LucideIcon> = {
  f1: Gamepad2,
  f2: Palette,
  f3: Baby,
  f4: Cake,
}

function FamilyKidsSection() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, fadeIn, stagger } = useReveal()
  return (
    <Section id="family-kids" className="relative py-28 sm:py-36">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--lux-gold), transparent)" }}
      />
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.familyKids.kicker")}
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.familyKids.titleA")}
            <span className="text-gold italic">{t("landing.familyKids.titleEm")}</span>
            {t("landing.familyKids.titleB")}
          </h2>
          <p className="mt-6 text-pretty text-base leading-relaxed text-amber-900/85 sm:text-lg">
            {t("landing.familyKids.lead")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Visuels */}
          <motion.div variants={fadeIn} className="relative min-w-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_32px_64px_-28px_rgba(74,15,28,0.35)]">
              <motion.img
                whileHover={preferReducedMotion ? undefined : { scale: 1.06 }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
                src={FAMILY_KIDS_IMGS.hero}
                alt={t("landing.familyKids.photoAlt1")}
                className={cn(LANDING_PHOTO)}
                onError={(e) => {
                  e.currentTarget.src = FAMILY_KIDS_FALLBACK
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/14 via-transparent to-white/[0.06]" />
            </div>
            {/* Petite carte flottante haut-gauche : activités créatives */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute -top-6 -left-4 hidden w-[180px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-22px_rgba(26,20,16,0.4)] sm:-left-8 md:block"
            >
              <div className="relative h-[150px] w-full bg-amber-50">
                <img
                  src={FAMILY_KIDS_IMGS.art}
                  alt={t("landing.familyKids.photoAlt2")}
                  className={LANDING_PHOTO}
                  onError={(e) => {
                    e.currentTarget.src = FAMILY_KIDS_FALLBACK
                  }}
                />
              </div>
            </motion.div>
            {/* Petite carte flottante bas-droit : aire de jeux */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute -bottom-8 -right-4 hidden w-[220px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-22px_rgba(26,20,16,0.4)] sm:-right-8 md:block"
            >
              <div className="relative h-[140px] w-full bg-amber-50">
                <img
                  src={FAMILY_KIDS_IMGS.play}
                  alt={t("landing.familyKids.photoAlt2")}
                  className={LANDING_PHOTO}
                  onError={(e) => {
                    e.currentTarget.src = FAMILY_KIDS_FALLBACK
                  }}
                />
              </div>
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--lux-gold-deep)]">
                  {t("landing.familyKids.badgeLabel")}
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-amber-950">
                  {t("landing.familyKids.badgeValue")}
                </p>
              </div>
            </motion.div>
            <div
              className="absolute -left-4 -top-4 -z-10 h-full w-full rounded-[2rem] border-2"
              style={{ borderColor: "color-mix(in srgb, var(--lux-gold) 45%, transparent)" }}
              aria-hidden
            />
          </motion.div>

          {/* Liste des features */}
          <motion.div variants={stagger} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {FAMILY_FEATURES.map((key) => {
              const Icon = FAMILY_ICONS[key]
              return (
                <motion.div
                  key={key}
                  variants={fadeUp}
                  whileHover={preferReducedMotion ? undefined : { y: -4 }}
                  className="premium-card group relative h-full p-6"
                >
                  <div
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-[color:var(--lux-ink)] shadow-[0_10px_30px_-14px_rgba(201,162,76,0.55)]"
                    style={{ background: "var(--lux-gradient-gold)" }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-amber-950">
                    {t(`landing.familyKids.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
                    {t(`landing.familyKids.${key}.desc`)}
                  </p>
                </motion.div>
              )
            })}
            <motion.div variants={fadeUp} className="sm:col-span-2">
              <Button asChild variant="gold" size="hero" className="w-full sm:w-auto shadow-lg">
                <Link href="/reservation">
                  <Calendar className="h-5 w-5" />
                  {t("landing.familyKids.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Réservation CTA                                                           */
/* -------------------------------------------------------------------------- */

function ReservationCTA() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { scaleIn } = useReveal()
  return (
    <Section className="py-20">
      <div className="site-container">
        <motion.div
          variants={scaleIn}
          whileHover={preferReducedMotion ? undefined : { y: -4 }}
          className="relative overflow-hidden rounded-[2rem] p-10 text-white shadow-[0_40px_80px_-35px_rgba(74,15,28,0.55)] sm:p-14"
          style={{ background: "var(--lux-gradient-ink)" }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--lux-gradient-gold)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--lux-bordeaux), transparent 70%)" }}
          />
          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--lux-gold-bright)" }}>
                {t("landing.resa.kicker")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                {t("landing.resa.titleA")}<span className="text-gold italic">{t("landing.resa.titleEm")}</span>
              </h2>
              <p className="mt-5 max-w-xl text-[color:var(--lux-sand)]/90">
                {t("landing.resa.sub")}
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Button
                asChild
                variant="gold"
                size="hero"
                className="group shadow-xl hover:shadow-2xl"
              >
                <Link href="/reservation">
                  <Calendar className="h-5 w-5" />
                  {t("landing.resa.cta")}
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Événements                                                                */
/* -------------------------------------------------------------------------- */

function EventsSection() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, stagger } = useReveal()
  const keys = ["e1", "e2", "e3"] as const
  const events = keys.map((k, i) => ({
    title: t(`landing.events.${k}.title`),
    desc: t(`landing.events.${k}.desc`),
    img: EVENT_IMGS[i],
  }))
  return (
    <Section className="py-28 sm:py-36" id="events">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.events.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.events.titleA")}<span className="text-gold italic">{t("landing.events.titleEm")}</span>
          </h2>
          <p className="mt-6 text-lg text-amber-900/80">
            {t("landing.events.lead")}
          </p>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 gap-8 sm:gap-9 md:grid-cols-2 md:gap-10 lg:grid-cols-3 lg:gap-10">
          {events.map((e) => (
            <motion.div
              key={e.title}
              variants={fadeUp}
              whileHover={preferReducedMotion ? undefined : { y: -6 }}
              className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-amber-200/40 bg-white/95 shadow-[0_22px_55px_-28px_rgba(74,15,28,0.42)] backdrop-blur-[2px]"
            >
              <div className="relative h-[200px] w-full shrink-0 overflow-hidden md:h-[260px]">
                <motion.img
                  src={e.img}
                  alt={e.title}
                  className={cn(LANDING_PHOTO, "block")}
                  whileHover={preferReducedMotion ? undefined : { scale: 1.06 }}
                  transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-amber-950/40 via-amber-950/10 to-transparent"
                  aria-hidden
                />
              </div>
              <div className="flex flex-1 flex-col p-6 text-amber-950">
                <h3 className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{e.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-amber-900/88 sm:text-[0.9375rem] sm:leading-[1.65]">{e.desc}</p>
                <Link
                  href="/events"
                  className="mt-5 inline-flex shrink-0 items-center gap-1 pt-1 text-sm font-semibold text-[color:var(--lux-gold-deep)] transition hover:text-[color:var(--lux-gold-deep)] group-hover:gap-2"
                >
                  {t("landing.events.more")} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
        >
          <Button asChild variant="gold" size="hero" className="shadow-lg">
            <Link href="/events">
              <Calendar className="h-5 w-5" />
              {t("landing.events.ctaEvent")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="luxOutlineBordeaux" size="hero" className="border-2 bg-white/80 shadow-md sm:min-w-[220px]">
            <Link href="/#contact">
              {t("landing.events.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Livraison                                                                 */
/* -------------------------------------------------------------------------- */

function DeliverySection() {
  const { t } = useI18n()
  const reduceFloating = useReducedMotion() === true
  const { fadeUp, fadeIn } = useReveal()
  const tags = [t("landing.delivery.t1"), t("landing.delivery.t2"), t("landing.delivery.t3"), t("landing.delivery.t4")]
  return (
    <Section className="relative overflow-hidden py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[85%] max-h-[860px] -translate-y-1/2 opacity-80"
        style={{
          background: "radial-gradient(ellipse 68% 50% at 50% 50%, rgba(201,162,76,0.07), transparent 60%)",
        }}
      />
      <div className="relative site-container">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={fadeUp}
            className="min-w-0 w-full text-center lg:text-left"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.delivery.kicker")}
            </p>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.12] tracking-tight text-amber-950 sm:text-5xl lg:text-[2.85rem] lg:leading-[1.1]">
              {t("landing.delivery.titleA")}<span className="text-gold italic">{t("landing.delivery.titleEm")}</span>
              {t("landing.delivery.titleB")}
            </h2>
            <div className="hairline-gold mx-auto my-8 lg:mx-0" />
            <p className="text-pretty text-[1.05rem] leading-[1.75] text-amber-900/[0.93] sm:text-lg sm:leading-[1.76]">
              {t("landing.delivery.text")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {tags.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-[color:var(--lux-gold)]/40 bg-white/75 px-4 py-1.5 text-xs font-semibold text-amber-950 shadow-sm backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-10 flex justify-center lg:justify-start">
              <PrimaryCTA href="/reservation" icon={<Calendar className="h-5 w-5" />}>
                {t("landing.delivery.cta")}
              </PrimaryCTA>
            </div>
          </motion.div>
          <motion.div variants={fadeIn} className="relative flex min-w-0 w-full justify-center">
            <div
              className={cn(
                "relative w-full rounded-[26px] bg-gradient-to-b from-white/35 via-white/[0.1] to-transparent p-3 shadow-[0_32px_80px_-34px_rgba(74,15,28,0.4),0_18px_48px_-26px_rgba(26,20,16,0.2)] backdrop-blur-[2px] ring-1 ring-amber-900/[0.06]",
                !reduceFloating && "translate-y-2 motion-reduce:translate-y-0",
              )}
            >
              <div className="relative aspect-square overflow-hidden rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_24px_60px_-30px_rgba(74,15,28,0.4)] ring-1 ring-inset ring-white/30">
                <motion.img
                  whileHover={reduceFloating ? undefined : { scale: 1.045 }}
                  transition={{ duration: 1.15, ease: [0.2, 0.8, 0.2, 1] }}
                  src={DELIVERY_IMG}
                  alt={t("landing.delivery.imgAlt")}
                  className={LANDING_PHOTO}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-amber-950/12 via-transparent to-white/[0.08]" />
              </div>
            </div>
            {/* Floating badge */}
            {reduceFloating ? (
              <div className="absolute -left-4 top-8 flex items-center gap-3 rounded-2xl border border-[color:var(--lux-gold)]/25 bg-white/95 px-5 py-4 shadow-[0_24px_60px_-24px_rgba(26,20,16,0.35)] backdrop-blur-sm sm:left-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--lux-ink)]"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-amber-800/70">{t("landing.delivery.floatLabel")}</p>
                  <p className="font-display text-lg font-bold text-amber-950">{t("landing.delivery.floatValue")}</p>
                </div>
              </div>
            ) : (
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 top-8 flex items-center gap-3 rounded-2xl border border-[color:var(--lux-gold)]/25 bg-white/95 px-5 py-4 shadow-[0_24px_60px_-24px_rgba(26,20,16,0.35)] backdrop-blur-sm sm:left-0"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--lux-ink)]"
                style={{ background: "var(--lux-gradient-gold)" }}
              >
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-amber-800/70">{t("landing.delivery.floatLabel")}</p>
                <p className="font-display text-lg font-bold text-amber-950">{t("landing.delivery.floatValue")}</p>
              </div>
            </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Avis clients                                                              */
/* -------------------------------------------------------------------------- */

/** Représentation visuelle cohérente avec un score type Google (ex. 4,3/5) */
function GoogleAggregateStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const partial = Math.max(0, Math.min(1, rating - full))
  return (
    <div
      className="flex items-center justify-center gap-0.5"
      aria-label={`${rating} sur 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < full) {
          return (
            <Star
              key={i}
              className="h-6 w-6 fill-[color:var(--lux-gold)] text-[color:var(--lux-gold)] sm:h-7 sm:w-7"
            />
          )
        }
        if (i === full && partial > 0.01) {
          return (
            <span key={i} className="relative inline-block h-6 w-6 sm:h-7 sm:w-7">
              <Star className="h-6 w-6 text-amber-200/50 sm:h-7 sm:w-7" />
              <span
                className="absolute left-0 top-0 h-full overflow-hidden"
                style={{ width: `${partial * 100}%` }}
              >
                <Star className="h-6 w-6 fill-[color:var(--lux-gold)] text-[color:var(--lux-gold)] sm:h-7 sm:w-7" />
              </span>
            </span>
          )
        }
        return (
          <Star key={i} className="h-6 w-6 text-amber-200/45 sm:h-7 sm:w-7" />
        )
      })}
    </div>
  )
}

function Reviews() {
  const { t } = useI18n()
  const preferReducedMotion = useReducedMotion() === true
  const { fadeUp, stagger } = useReveal()
  const keys = ["r1", "r2", "r3"] as const
  const summaryRating = 4.3
  return (
    <Section className="py-28 sm:py-36">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.reviews.kicker")}
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.reviews.heading")}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-amber-900/85 sm:text-lg">
            {t("landing.reviews.lead")}
          </p>
          <div className="mt-6">
            <GoogleAggregateStars rating={summaryRating} />
          </div>
          <p className="mt-3 text-sm text-amber-800/90">
            <span className="font-semibold tabular-nums text-amber-950">
              {t("landing.reviews.summaryScore")}
            </span>
            <span className="mx-2 text-amber-700/50">·</span>
            {t("landing.reviews.summaryNote")}
          </p>
          <div className="mt-6">
            <Button asChild variant="gold" size="panel" className="shadow-md">
              <a href={t("landing.reviews.googleHref")} target="_blank" rel="noopener noreferrer">
                {t("landing.reviews.ctaGoogle")}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          {typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL === "string" &&
          process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL.length > 12 ? (
            <div className="mt-10 overflow-hidden rounded-[24px] border border-[color:var(--lux-gold)]/20 shadow-lg">
              <iframe
                title="Google Maps — avis et fiche"
                src={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL}
                className="h-[min(420px,55vh)] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {keys.map((k) => {
            const r = {
              name: t(`landing.reviews.${k}.name`),
              role: t(`landing.reviews.${k}.role`),
              text: t(`landing.reviews.${k}.text`),
            }
            return (
            <motion.div
              key={k}
              variants={fadeUp}
              whileHover={preferReducedMotion ? undefined : { y: -6 }}
              className="premium-card group relative h-full p-8"
            >
              <Quote className="absolute right-6 top-6 h-10 w-10 text-[color:var(--lux-gold)]/40" />
              <div className="mb-4 flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[color:var(--lux-gold)] text-[color:var(--lux-gold)]"
                  />
                ))}
              </div>
              <p className="text-base italic leading-relaxed text-amber-900/90">
                « {r.text} »
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full font-semibold text-[color:var(--lux-ink)]"
                  style={{ background: "var(--lux-gradient-gold)" }}
                >
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-amber-950">{r.name}</p>
                  <p className="text-xs text-amber-800/70">{r.role}</p>
                </div>
              </div>
            </motion.div>
            )
          })}
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Galerie                                                                   */
/* -------------------------------------------------------------------------- */

/** Durée pendant laquelle chaque image reste affichée (incl. fondu). */
const SLIDE_DURATION_MS = 3800
/** Durée totale du Ken Burns (un peu > au slide pour garder le mouvement vivant). */
const KEN_BURNS_S = (SLIDE_DURATION_MS + 800) / 1000

function Gallery() {
  const { t } = useI18n()
  const kenReduced = useReducedMotion() === true
  const { fadeUp, scaleIn } = useReveal()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const len = GALLERY.length

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % len)
    }, SLIDE_DURATION_MS)
    return () => clearInterval(id)
  }, [paused, len])

  const goTo = (i: number) => setIndex(((i % len) + len) % len)
  const next = () => goTo(index + 1)
  const prev = () => goTo(index - 1)

  return (
    <Section className="py-28 sm:py-36">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.gallery.kicker")}
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.gallery.titleA")}<span className="text-gold italic">{t("landing.gallery.titleEm")}</span>
          </h2>
        </motion.div>

        <motion.div
          variants={scaleIn}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="group relative mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-[20px] bg-amber-50 shadow-[0_30px_80px_-30px_rgba(74,15,28,0.45)] ring-1 ring-[color:var(--lux-gold)]/20"
          aria-roledescription="carousel"
          aria-label={t("landing.gallery.titleA") + t("landing.gallery.titleEm")}
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={GALLERY[index]}
              src={GALLERY[index]}
              alt={`${t("landing.gallery.imageAlt")} ${index + 1}`}
              className="absolute inset-0 h-full w-full object-cover [filter:brightness(1.04)_contrast(1.04)_saturate(1.05)]"
              initial={{ opacity: 0, scale: kenReduced ? 1 : 1.0 }}
              animate={{ opacity: 1, scale: kenReduced ? 1 : 1.06 }}
              exit={{ opacity: 0, scale: kenReduced ? 1 : 1.08 }}
              transition={
                kenReduced
                  ? { duration: 0.28 }
                  : {
                      opacity: { duration: 1.0, ease: [0.2, 0.8, 0.2, 1] },
                      scale: { duration: KEN_BURNS_S, ease: "linear" },
                    }
              }
              loading="lazy"
              draggable={false}
            />
          </AnimatePresence>

          <button
            type="button"
            onClick={prev}
            aria-label="Image précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/55 text-amber-950 backdrop-blur-md ring-1 ring-white/60 opacity-0 transition-all duration-300 hover:bg-white/85 hover:scale-105 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)] sm:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Image suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/55 text-amber-950 backdrop-blur-md ring-1 ring-white/60 opacity-0 transition-all duration-300 hover:bg-white/85 hover:scale-105 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--lux-gold)] sm:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/35 px-3 py-2 backdrop-blur-md ring-1 ring-white/50 sm:bottom-5"
            role="tablist"
            aria-label="Sélecteur d'image"
          >
            {GALLERY.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-out",
                  i === index
                    ? "w-7 bg-[color:var(--lux-gold-deep)]"
                    : "w-2 bg-amber-950/35 hover:bg-amber-950/55",
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

function Contact() {
  const { t } = useI18n()
  const { fadeUp, scaleIn } = useReveal()
  return (
    <Section id="contact" className="py-28 sm:py-36">
      <div className="site-container">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.contact.kicker")}
          </p>
          <h2 className="mt-4 text-balance font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.contact.heading")}
          </h2>
          <p className="mt-5 text-pretty text-base leading-relaxed text-amber-900/85 sm:text-lg">
            {t("landing.contact.lead")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <motion.div variants={fadeUp} className="premium-card p-8 sm:p-10">
            <ContactRow
              icon={<MapPin className="h-5 w-5" />}
              title={t("landing.contact.addressTitle")}
              lines={[t("landing.contact.addressL1"), t("landing.contact.addressL2")]}
            />
            <div className="hairline-gold my-6" />
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--lux-ink)] shadow-md"
                style={{ background: "var(--lux-gradient-gold)" }}
              >
                <PhoneIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800/70">
                  {t("landing.contact.phoneTitle")}
                </p>
                <p className="mt-1 font-display text-lg font-medium text-amber-950">
                  <a
                    href={`tel:${t("landing.contact.phoneDial")}`}
                    className="hover:underline"
                  >
                    {t("landing.contact.phone")}
                  </a>
                </p>
                <a
                  href={t("landing.contact.whatsappHref")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--lux-bordeaux)] hover:underline"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {t("landing.contact.whatsappLabel")}
                </a>
              </div>
            </div>
            <div className="hairline-gold my-6" />
            <ContactRow
              icon={<Mail className="h-5 w-5" />}
              title={t("landing.contact.emailTitle")}
              lines={[t("landing.contact.email")]}
            />
            <div className="hairline-gold my-6" />
            <ContactRow
              icon={<Clock className="h-5 w-5" />}
              title={t("landing.contact.hoursTitle")}
              lines={[
                t("landing.contact.hourMon"),
                t("landing.contact.hourTue"),
                t("landing.contact.hourWed"),
                t("landing.contact.hourThu"),
                t("landing.contact.hourFri"),
                t("landing.contact.hourSat"),
                t("landing.contact.hourSun"),
              ]}
            />
            <div className="hairline-gold my-6" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800/70">
              {t("landing.contact.socialTitle")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-amber-900/90">
              <li>
                <a
                  href={t("landing.contact.whatsappHref")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  {t("landing.contact.whatsappLabel")}
                </a>
              </li>
              <li>
                <a
                  href={t("landing.contact.mapHref")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  {t("landing.contact.mapLinkLabel")}
                </a>
              </li>
              <li>
                <a
                  href={SITE.contact.googleBusinessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
                >
                  <Star className="h-4 w-4 shrink-0" />
                  {t("landing.contact.googleBusinessLabel")}
                </a>
              </li>
              <li>
                <a
                  href={SITE.contact.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
                >
                  <Instagram className="h-4 w-4 shrink-0" />
                  {t("landing.contact.instagramLabel")}
                </a>
              </li>
              <li>
                <a
                  href={SITE.contact.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
                >
                  <Facebook className="h-4 w-4 shrink-0" />
                  {t("landing.contact.facebookLabel")}
                </a>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="panelSm">
                <a href={`tel:${t("landing.contact.phoneDial")}`}>
                  <PhoneIcon className="h-4 w-4" /> {t("landing.contact.call")}
                </a>
              </Button>
              <Button asChild variant="luxOutlineBordeaux" size="panelSm">
                <Link href="/reservation">
                  <Calendar className="h-4 w-4" /> {t("landing.contact.book")}
                </Link>
              </Button>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="flex flex-col overflow-hidden rounded-[1.75rem] shadow-xl ring-1 ring-[color:var(--lux-gold)]/25">
            <div className="border-b border-[color:var(--lux-gold)]/15 bg-white/60 px-4 py-3 text-center text-sm">
              <a
                href={t("landing.contact.mapHref")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[color:var(--lux-bordeaux)] underline-offset-2 hover:underline"
              >
                {t("landing.contact.mapLinkLabel")}
              </a>
            </div>
            <iframe
              title={t("landing.contact.mapTitle")}
              src="https://www.openstreetmap.org/export/embed.html?bbox=11.012%2C50.968%2C11.052%2C50.992&layer=mapnik"
              className="h-full min-h-[360px] w-full flex-1"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </Section>
  )
}

function ContactRow({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[color:var(--lux-ink)] shadow-md"
        style={{ background: "var(--lux-gradient-gold)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800/70">{title}</p>
        <div className="mt-1 space-y-0.5 font-display text-lg font-medium text-amber-950">
          {lines.map((l, idx) => (
            <p key={idx}>{l}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function FooterElegant() {
  const { t } = useI18n()
  return (
    <footer
      className="relative overflow-hidden text-white"
      style={{ background: "var(--lux-gradient-ink)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(201,162,76,0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(110,29,43,0.25), transparent 50%)",
        }}
      />
      <div className="site-container relative py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl ring-2 ring-[color:var(--lux-gold)]/50"
                style={{ background: "var(--lux-gradient-ink)" }}
              >
                <BloudanLogoMark withPhotoBack />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">{t("landing.footer.brand")}</p>
                <p className="text-sm text-[color:var(--lux-sand)]/80">{t("landing.footer.tagline")}</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[color:var(--lux-sand)]/85">
              {t("landing.footer.about")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialIcon
                href={SITE.contact.googleBusinessUrl}
                icon={<Star className="h-5 w-5" />}
                ariaLabel={t("landing.contact.googleBusinessLabel")}
              />
              <SocialIcon
                href={SITE.contact.instagramUrl}
                icon={<Instagram className="h-5 w-5" />}
                ariaLabel={t("landing.contact.instagramLabel")}
              />
              <SocialIcon
                href={SITE.contact.facebookUrl}
                icon={<Facebook className="h-5 w-5" />}
                ariaLabel={t("landing.contact.facebookLabel")}
              />
            </div>
          </div>

          <div>
            <p className="font-display text-lg font-semibold" style={{ color: "var(--lux-gold-bright)" }}>
              {t("landing.footer.nav")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--lux-sand)]/85">
              <li><Link href="/" className="hover:text-white">{t("landing.footer.fHome")}</Link></li>
              <li><Link href="/menu" className="hover:text-white">{t("landing.footer.fMenu")}</Link></li>
              <li><Link href="/reservation" className="hover:text-white">{t("landing.footer.fResa")}</Link></li>
              <li><Link href="/events" className="hover:text-white">{t("landing.footer.fEvents")}</Link></li>
              <li><Link href="/delivery" className="hover:text-white">{t("landing.footer.fDelivery")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-display text-lg font-semibold" style={{ color: "var(--lux-gold-bright)" }}>
              {t("landing.footer.contact")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[color:var(--lux-sand)]/85">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {t("landing.contact.addressL1")}, {t("landing.contact.addressL2")}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0" />
                <a href={`tel:${t("landing.contact.phoneDial")}`} className="hover:text-white">
                  {t("landing.contact.phone")}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${t("landing.contact.email")}`} className="hover:text-white">
                  {t("landing.contact.email")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="hairline-gold my-10 opacity-60" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[color:var(--lux-sand)]/70 sm:flex-row">
          <p>© {new Date().getFullYear()} {t("landing.footer.brand")} — {t("landing.footer.endLine")}</p>
          <p className="font-display italic">{t("landing.footer.byline")}</p>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({
  href,
  icon,
  ariaLabel,
}: {
  href: string
  icon: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 transition hover:border-[color:var(--lux-gold)] hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lux-gold)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lux-bordeaux)]"
    >
      {icon}
    </a>
  )
}
