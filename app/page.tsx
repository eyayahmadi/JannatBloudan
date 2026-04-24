"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Award,
  Calendar,
  ChefHat,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Leaf,
  MapPin,
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
} from "lucide-react"
import { PublicHeader } from "@/components/site/PublicHeader"
import { BloudanLogoMark } from "@/components/site/BloudanLogoMark"
import { Button } from "@/components/ui/button"
import { ChatWidget } from "@/components/chat/ChatWidget"
import { cn } from "@/lib/utils"
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
  return (
    <motion.section
      id={id}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={cn("relative", className)}
    >
      {children}
    </motion.section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const CUISINE_ORDER = ["mezze", "grillades", "desserts", "boissons", "chicha"] as const
const CUISINE_ICONS: Record<(typeof CUISINE_ORDER)[number], LucideIcon> = {
  mezze: Leaf,
  grillades: Flame,
  desserts: Heart,
  boissons: Wine,
  chicha: Sparkles,
}
const CUISINE_IMGS: Record<(typeof CUISINE_ORDER)[number], string> = {
  mezze: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
  grillades: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  desserts: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
  boissons: "https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=1200&q=80",
  chicha: "https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1200&q=80",
}

const POPULAR_ORDER = ["d1", "d2", "d3", "d4"] as const
const POPULAR_IMGS: Record<(typeof POPULAR_ORDER)[number], string> = {
  d1: "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=900&q=80",
  d2: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  d3: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=80",
  d4: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80",
}

const WHY_ICONS = [Truck, Leaf, ChefHat, Shield] as const

const EVENT_IMGS = [
  "https://images.unsplash.com/photo-1464366404606-a3988986a6b9?auto=format&fit=crop&w=1100&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1100&q=80",
  "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1100&q=80",
] as const

const GALLERY = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c1?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=1200&q=80",
] as const

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--lux-gradient-paper)" }}>
      <PublicHeader />

      <Hero />
      <StatsStrip />
      <StoryBloudan />
      <CuisineSection />
      <PopularDishes />
      <MenuPreview />
      <WhyOrder />
      <Experience />
      <ReservationCTA />
      <EventsSection />
      <DeliverySection />
      <Reviews />
      <Gallery />
      <Contact />
      <FooterElegant />

      <ChatWidget />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 140])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <section ref={ref} className="relative min-h-[92vh] w-full overflow-hidden">
      {/* Background image with parallax + zoom */}
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=85"
          alt={t("landing.hero.imageAlt")}
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,20,16,0.72) 0%, rgba(74,15,28,0.55) 45%, rgba(26,20,16,0.85) 100%)",
          }}
        />
        {/* Decorative gold dust */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(217,183,106,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(217,183,106,0.2), transparent 45%)",
          }}
        />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--lux-sand)] backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--lux-gold-bright)]" />
          {t("landing.hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[88px]"
        >
          {t("landing.hero.h1a")}
          <span
            className="italic"
            style={{
              backgroundImage: "var(--lux-gradient-gold)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("landing.hero.h1b")}
          </span>
          <br />
          {t("landing.hero.h1c")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--lux-sand)] sm:text-xl"
        >
          {t("landing.hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
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
          transition={{ duration: 1.4, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
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
      <Link href={href}>
        {icon}
        <span className="relative z-10">{children}</span>
        <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/50 to-transparent transition duration-700 group-hover:translate-x-[120%]"
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
      <Link href={href}>
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
  const stats = [
    { icon: Star, value: t("landing.stats.s1"), label: t("landing.stats.l1") },
    { icon: Clock, value: t("landing.stats.s2"), label: t("landing.stats.l2") },
    { icon: Award, value: t("landing.stats.s3"), label: t("landing.stats.l3") },
    { icon: Users, value: t("landing.stats.s4"), label: t("landing.stats.l4") },
  ] as const
  return (
    <Section className="border-b border-[color:var(--lux-gold)]/20 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger} className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                whileHover={{ y: -4 }}
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
  return (
    <Section id="about" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.story.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.story.titleA")}
            <span className="text-gold italic">{t("landing.story.titleB")}</span>
            {t("landing.story.titleC")}
          </h2>
          <div className="hairline-gold my-8" />
          <div className="space-y-5 text-base leading-relaxed text-amber-900/90 sm:text-lg">
            <p>{t("landing.story.p1")}</p>
            <p>{t("landing.story.p2")}</p>
            <p className="italic text-[color:var(--lux-bordeaux)]">{t("landing.story.quote")}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild variant="luxPanel" size="panel">
              <Link href="/menu">
                {t("landing.story.cta")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div variants={fadeIn} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(74,15,28,0.45)]">
            <motion.img
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c1?auto=format&fit=crop&w=1400&q=85"
              alt={t("landing.story.imageAlt")}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          {/* Floating card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute -bottom-6 -left-6 max-w-[240px] rounded-2xl bg-white p-5 shadow-[0_24px_60px_-22px_rgba(26,20,16,0.4)] sm:-left-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--lux-gold-deep)]">
              {t("landing.story.cardKicker")}
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-amber-950">
              {t("landing.story.cardTitle")}
            </p>
          </motion.div>
          {/* Decorative gold frame */}
          <div
            className="absolute -right-6 -top-6 -z-10 h-full w-full rounded-[2rem] border-2"
            style={{ borderColor: "color-mix(in srgb, var(--lux-gold) 45%, transparent)" }}
            aria-hidden
          />
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Cuisine syrienne                                                          */
/* -------------------------------------------------------------------------- */

function CuisineSection() {
  const { t } = useI18n()
  return (
    <Section className="py-24 sm:py-32" id="cuisine">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.cuisine.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.cuisine.titleA")}
            <span className="text-gold italic">{t("landing.cuisine.titleEm")}</span>
          </h2>
          <p className="mt-6 text-lg text-amber-900/80">
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
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_50px_-24px_rgba(74,15,28,0.35)] ring-1 ring-[color:var(--lux-gold)]/15"
              >
                <div className="relative h-60 overflow-hidden">
                  <motion.img
                    src={CUISINE_IMGS[id]}
                    alt={title}
                    className="h-full w-full object-cover"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
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
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Plats populaires                                                          */
/* -------------------------------------------------------------------------- */

function PopularDishes() {
  const { t } = useI18n()
  return (
    <Section className="relative py-24 sm:py-32" id="popular">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, var(--lux-gold), transparent)" }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
              {t("landing.popular.kicker")}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
              {t("landing.popular.titleA")}<span className="text-gold italic">{t("landing.popular.titleEm")}</span>
            </h2>
          </div>
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
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="premium-card group flex flex-col overflow-hidden p-0"
            >
              <div className="relative h-52 overflow-hidden">
                <motion.img
                  src={d.img}
                  alt={d.name}
                  className="h-full w-full object-cover"
                  whileHover={{ scale: 1.08 }}
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
                    className="hover:scale-[1.04]"
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
  const categories = Array.from({ length: 8 }, (_, i) => t(`landing.menuPreview.cat${i}`))
  return (
    <Section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(180deg, transparent, rgba(242,233,215,0.4), transparent)" }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mb-10 text-center">
          <h3 className="font-display text-3xl font-semibold text-amber-950 sm:text-4xl">
            {t("landing.menuPreview.titleBefore")}
            <span className="text-gold italic">{t("landing.menuPreview.titleEm")}</span>
            {t("landing.menuPreview.titleAfter")}
          </h3>
        </motion.div>
      </div>
      <div className="relative flex overflow-hidden">
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
  const keys = ["r1", "r2", "r3", "r4"] as const
  return (
    <Section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                whileHover={{ y: -6 }}
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
  const bullets = [t("landing.experience.b1"), t("landing.experience.b2"), t("landing.experience.b3"), t("landing.experience.b4")]
  return (
    <Section className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
        <motion.div variants={fadeIn} className="relative order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
              <motion.img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
                alt={t("landing.experience.img1")}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 1 }}
              />
            </motion.div>
            <motion.div whileHover={{ y: -4 }} className="relative mt-10 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
              <motion.img
                src="https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=900&q=80"
                alt={t("landing.experience.img2")}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.experience.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.experience.titleA")}<span className="text-gold italic">{t("landing.experience.titleEm")}</span>
            {t("landing.experience.titleB")}
          </h2>
          <div className="hairline-gold my-8" />
          <p className="text-base leading-relaxed text-amber-900/90 sm:text-lg">
            {t("landing.experience.text")}
          </p>
          <motion.ul variants={stagger} className="mt-8 space-y-3">
            {bullets.map((line) => (
              <motion.li key={line} variants={fadeUp} className="flex items-start gap-3 text-sm text-amber-950 sm:text-base">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--lux-gradient-gold)" }}>
                  <svg className="h-3 w-3 text-[color:var(--lux-ink)]" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{line}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Réservation CTA                                                           */
/* -------------------------------------------------------------------------- */

function ReservationCTA() {
  const { t } = useI18n()
  return (
    <Section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={scaleIn}
          whileHover={{ y: -4 }}
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
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
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
  const keys = ["e1", "e2", "e3"] as const
  const events = keys.map((k, i) => ({
    title: t(`landing.events.${k}.title`),
    desc: t(`landing.events.${k}.desc`),
    img: EVENT_IMGS[i],
  }))
  return (
    <Section className="py-24 sm:py-32" id="events">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.events.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.events.titleA")}<span className="text-gold italic">{t("landing.events.titleEm")}</span>
            {t("landing.events.titleB")}
          </h2>
          <p className="mt-6 text-lg text-amber-900/80">
            {t("landing.events.lead")}
          </p>
        </motion.div>
        <motion.div variants={stagger} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {events.map((e) => (
            <motion.div
              key={e.title}
              variants={fadeUp}
              whileHover={{ y: -8 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-xl"
            >
              <motion.img
                src={e.img}
                alt={e.title}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 className="font-display text-2xl font-semibold sm:text-3xl">{e.title}</h3>
                <p className="mt-2 text-sm text-white/90">{e.desc}</p>
                <Link
                  href="/events"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--lux-gold-bright)] transition group-hover:gap-2"
                >
                  {t("landing.events.more")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
        <motion.div variants={fadeUp} className="mt-12 flex justify-center">
          <Button asChild variant="gold" size="hero">
            <Link href="/events">
              <Calendar className="h-5 w-5" />
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
  const tags = [t("landing.delivery.t1"), t("landing.delivery.t2"), t("landing.delivery.t3"), t("landing.delivery.t4")]
  return (
    <Section className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.delivery.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.delivery.titleA")}<span className="text-gold italic">{t("landing.delivery.titleEm")}</span>
            {t("landing.delivery.titleB")}
          </h2>
          <div className="hairline-gold my-8" />
          <p className="text-base leading-relaxed text-amber-900/90 sm:text-lg">
            {t("landing.delivery.text")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {tags.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[color:var(--lux-gold)]/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-amber-950 backdrop-blur"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <PrimaryCTA href="/delivery" icon={<Truck className="h-5 w-5" />}>
              {t("landing.delivery.cta")}
            </PrimaryCTA>
          </div>
        </motion.div>
        <motion.div variants={fadeIn} className="relative">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(74,15,28,0.45)]">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 1.2 }}
              src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85"
              alt={t("landing.delivery.imgAlt")}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Floating badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-8 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl"
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
        </motion.div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Avis clients                                                              */
/* -------------------------------------------------------------------------- */

function Reviews() {
  const { t } = useI18n()
  const keys = ["r1", "r2", "r3"] as const
  return (
    <Section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.reviews.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.reviews.titleA")}<span className="text-gold italic">{t("landing.reviews.titleEm")}</span>
          </h2>
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
              whileHover={{ y: -6 }}
              className="premium-card group relative h-full p-8"
            >
              <Quote className="absolute right-6 top-6 h-10 w-10 text-[color:var(--lux-gold)]/40" />
              <div className="mb-5 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[color:var(--lux-gold)] text-[color:var(--lux-gold)]" />
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

function Gallery() {
  const { t } = useI18n()
  return (
    <Section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.gallery.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.gallery.titleA")}<span className="text-gold italic">{t("landing.gallery.titleEm")}</span>
          </h2>
        </motion.div>

        <motion.div variants={stagger} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {GALLERY.map((src, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl shadow-md",
                i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
              )}
            >
              <motion.img
                src={src}
                alt={`${t("landing.gallery.imageAlt")} ${i + 1}`}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            </motion.div>
          ))}
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
  return (
    <Section id="contact" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--lux-gold-deep)]">
            {t("landing.contact.kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-amber-950 sm:text-5xl lg:text-6xl">
            {t("landing.contact.titleA")}<span className="text-gold italic">{t("landing.contact.titleEm")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <motion.div variants={fadeUp} className="premium-card p-8 sm:p-10">
            <ContactRow
              icon={<MapPin className="h-5 w-5" />}
              title={t("landing.contact.addressTitle")}
              lines={[t("landing.contact.addressL1"), t("landing.contact.addressL2")]}
            />
            <div className="hairline-gold my-6" />
            <ContactRow
              icon={<PhoneIcon className="h-5 w-5" />}
              title={t("landing.contact.phoneTitle")}
              lines={[t("landing.contact.phone")]}
            />
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
              lines={[t("landing.contact.h1"), t("landing.contact.h2"), t("landing.contact.h3")]}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="panelSm">
                <a href="tel:+33123456789">
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
          <motion.div variants={scaleIn} className="overflow-hidden rounded-[1.75rem] shadow-xl ring-1 ring-[color:var(--lux-gold)]/25">
            <iframe
              title={t("landing.contact.mapTitle")}
              src="https://www.openstreetmap.org/export/embed.html?bbox=2.361%2C48.856%2C2.385%2C48.868&layer=mapnik"
              className="h-full min-h-[360px] w-full"
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
          {lines.map((l) => (
            <p key={l}>{l}</p>
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
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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
                <p className="font-display text-2xl font-semibold">Jannat Baloudan</p>
                <p className="text-sm text-[color:var(--lux-sand)]/80">{t("landing.footer.tagline")}</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[color:var(--lux-sand)]/85">
              {t("landing.footer.about")}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialIcon href="#" icon={<Instagram className="h-5 w-5" />} />
              <SocialIcon href="#" icon={<Facebook className="h-5 w-5" />} />
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
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4" /> 12 rue de l'Orient, Paris</li>
              <li className="flex items-center gap-2"><PhoneIcon className="h-4 w-4" /> +33 1 23 45 67 89</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@jannatbaloudan.fr</li>
            </ul>
          </div>
        </div>

        <div className="hairline-gold my-10 opacity-60" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[color:var(--lux-sand)]/70 sm:flex-row">
          <p>© {new Date().getFullYear()} Jannat Baloudan — {t("landing.footer.endLine")}</p>
          <p className="font-display italic">{t("landing.footer.byline")}</p>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 transition hover:border-[color:var(--lux-gold)] hover:bg-white/10"
    >
      {icon}
    </a>
  )
}
