"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Zap,
  Gift,
} from "lucide-react"
import Link from "next/link"
import { PageHero } from "@/components/site/PageHero"
import { PageShell } from "@/components/site/PageShell"
import { AIAgentBadge } from "@/components/ai/AIAgentBadge"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { MobileBottomNav } from "@/components/site/MobileBottomNav"
import { SITE } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Table = {
  id: string
  number: number
  capacity: number
  status: "available" | "occupied" | "reserved"
  x: number
  y: number
  type: "round" | "square" | "rectangular"
  zone: "terrasse" | "interieur" | "vip" | "gaming"
}

const tables: Table[] = [
  { id: "t1", number: 1, capacity: 2, status: "available", x: 50, y: 50, type: "round", zone: "interieur" },
  { id: "t2", number: 2, capacity: 2, status: "occupied", x: 150, y: 50, type: "round", zone: "interieur" },
  { id: "t3", number: 3, capacity: 4, status: "available", x: 250, y: 50, type: "square", zone: "interieur" },
  { id: "t4", number: 4, capacity: 4, status: "reserved", x: 350, y: 50, type: "square", zone: "terrasse" },
  { id: "t5", number: 5, capacity: 6, status: "available", x: 50, y: 150, type: "rectangular", zone: "terrasse" },
  { id: "t6", number: 6, capacity: 6, status: "available", x: 250, y: 150, type: "rectangular", zone: "terrasse" },
  { id: "t7", number: 7, capacity: 2, status: "available", x: 50, y: 250, type: "round", zone: "vip" },
  { id: "t8", number: 8, capacity: 4, status: "occupied", x: 150, y: 250, type: "square", zone: "vip" },
  { id: "t9", number: 9, capacity: 8, status: "available", x: 250, y: 250, type: "rectangular", zone: "gaming" },
]

const timeSlots = [
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
]

const zones = [
  { id: "terrasse", name: "Terrasse", icon: "🌿", description: "Vue sur le jardin" },
  { id: "interieur", name: "Intérieur", icon: "🏠", description: "Ambiance cosy" },
  { id: "vip", name: "VIP", icon: "⭐", description: "Espace privatif" },
  { id: "gaming", name: "Gaming Room", icon: "🎮", description: "Espace jeux" },
]

export default function ReservationPage() {
  const [step, setStep] = useState<"select" | "details" | "confirmed">("select")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [guests, setGuests] = useState(2)
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequest: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [reservationNumber, setReservationNumber] = useState<string | null>(null)
  const [reminderSent, setReminderSent] = useState(false)

  const isReturningCustomer = useMemo(() => {
    if (typeof window === "undefined") return false
    return Number(localStorage.getItem("jb-visits") ?? "0") > 2
  }, [])

  const suggestedTable = useMemo(() => {
    const zone = selectedZone || null
    const available = tables
      .filter((t) => t.status === "available" && t.capacity >= guests)
      .filter((t) => !zone || t.zone === zone)
      .sort((a, b) => a.capacity - b.capacity)
    return available[0] || null
  }, [guests, selectedZone])

  useEffect(() => {
    if (suggestedTable && !selectedTable) {
      setSelectedTable(suggestedTable)
    }
  }, [suggestedTable, selectedTable])

  const sendReminder = async () => {
    if (!reservationNumber) return
    try {
      await fetch("/api/reservations/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservationNumber }),
      })
      setReminderSent(true)
    } catch { /* ignore */ }
  }

  const handleTableSelect = (table: Table) => {
    if (table.status === "available" && table.capacity >= guests) {
      setSelectedTable(table)
    }
  }

  const handleContinue = () => {
    if (selectedDate && selectedTime && selectedTable) {
      setStep("details")
    }
  }

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !selectedTable) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          guests,
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          specialRequest: customerInfo.specialRequest,
          tableNumber: selectedTable.number,
          zone: selectedTable.zone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitError(data?.error || "Impossible de sauvegarder la réservation")
        return
      }

      setReservationNumber(data?.reservation?.id ?? null)
      setStep("confirmed")
    } catch (error) {
      setSubmitError("Erreur réseau ou serveur")
    } finally {
      setSubmitting(false)
    }
  }

  const getTableColor = (table: Table) => {
    if (table.status === "occupied")
      return "bg-red-100 border-red-300 text-red-700 cursor-not-allowed"
    if (table.status === "reserved")
      return "bg-orange-100 border-orange-300 text-orange-700 cursor-not-allowed"
    if (table.capacity < guests)
      return "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60"
    if (selectedZone && table.zone !== selectedZone)
      return "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-60"
    if (selectedTable?.id === table.id)
      return "border-[color:var(--lux-gold)] text-[color:var(--lux-ink)] cursor-pointer shadow-[0_10px_25px_-10px_rgba(201,162,76,0.55)] [background:var(--lux-gradient-gold)] scale-110"
    return "bg-emerald-50 border-emerald-300 text-emerald-800 cursor-pointer hover:bg-emerald-100 hover:border-emerald-500 hover:shadow-md"
  }

  const getTableSize = (type: string) => {
    switch (type) {
      case "round":
        return "w-16 h-16 rounded-full"
      case "square":
        return "w-20 h-20 rounded-lg"
      case "rectangular":
        return "w-28 h-16 rounded-lg"
      default:
        return "w-16 h-16 rounded-lg"
    }
  }

  const filteredTables = selectedZone ? tables.filter((t) => t.zone === selectedZone) : tables

  if (step === "confirmed") {
    return (
      <PageShell contentClassName="pb-20 lg:pb-0">
        <SiteHeader backHref="/" />
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-2xl border-white/50 bg-white/85 shadow-lg backdrop-blur-md animate-fade-up">
          <CardContent className="p-10 text-center sm:p-12">
            <div
              className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_18px_40px_-15px_rgba(16,185,129,0.5)]"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
              }}
            >
              <CheckCircle2 className="h-12 w-12" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full ring-4 ring-emerald-200/50 animate-pulse-glow"
              />
            </div>
            <h1 className="mb-4 font-display text-3xl font-semibold text-amber-950">Réservation confirmée !</h1>
            <p className="text-amber-900/75 mb-2">
              Numéro de réservation:{" "}
              <span className="font-semibold">{reservationNumber ?? "#en-attente"}</span>
            </p>

            <div className="bg-[color:var(--lux-cream)] rounded-lg p-6 my-8 space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-900/75">
                <Calendar className="w-5 h-5 text-[color:var(--lux-gold)]" />
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-900/75">
                <Clock className="w-5 h-5 text-[color:var(--lux-gold)]" />
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-900/75">
                <Users className="w-5 h-5 text-[color:var(--lux-gold)]" />
                <span className="font-medium">
                  {guests} personne{guests > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-amber-900/75">
                <MapPin className="w-5 h-5 text-[color:var(--lux-gold)]" />
                <span className="font-medium">
                  Table n°{selectedTable?.number} - {zones.find((z) => z.id === selectedTable?.zone)?.name}
                </span>
              </div>
              {customerInfo.specialRequest && (
                <div className="flex items-center justify-center gap-2 text-amber-900/75">
                  <Sparkles className="w-5 h-5 text-[color:var(--lux-gold)]" />
                  <span className="font-medium">{customerInfo.specialRequest}</span>
                </div>
              )}
            </div>

            <div className="bg-[color:var(--lux-gold)] rounded-lg p-4 mb-8">
              <p className="text-sm text-amber-950">
                Un email de confirmation a été envoyé à <span className="font-semibold">{customerInfo.email}</span>
              </p>
            </div>

            <div className="space-y-3">
              <Button size="lg" className="w-full" asChild>
                <Link href="/reservation/my-reservations">Voir mes réservations</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-transparent"
                onClick={sendReminder}
                disabled={reminderSent}
              >
                {reminderSent ? "Rappel envoye !" : "Envoyer un rappel SMS/Email"}
              </Button>
              <Button size="lg" variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </PageShell>
    )
  }

  if (step === "details") {
    return (
      <PageShell contentClassName="pb-20 lg:pb-0">
        <SiteHeader backOnClick={() => setStep("select")} />

        <div className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">
          <h1 className="mb-2 font-display text-3xl font-semibold text-amber-950 animate-fade-up">Vos informations</h1>
          <p className="mb-8 text-amber-800/80">Complétez vos informations pour finaliser la réservation</p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[color:var(--lux-gold)]" />
                  <div>
                    <p className="text-sm text-amber-900/75">Date</p>
                    <p className="font-medium">{selectedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[color:var(--lux-gold)]" />
                  <div>
                    <p className="text-sm text-amber-900/75">Heure</p>
                    <p className="font-medium">{selectedTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[color:var(--lux-gold)]" />
                  <div>
                    <p className="text-sm text-amber-900/75">Personnes</p>
                    <p className="font-medium">{guests}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[color:var(--lux-gold)]" />
                  <div>
                    <p className="text-sm text-amber-900/75">Table</p>
                    <p className="font-medium">
                      N°{selectedTable?.number} - {zones.find((z) => z.id === selectedTable?.zone)?.name}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  placeholder="06 12 34 56 78"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="specialRequest" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Demande spéciale (optionnel)
                </Label>
                <Textarea
                  id="specialRequest"
                  placeholder="Ex: Anniversaire, décorations, allergies alimentaires, chaise haute pour bébé..."
                  value={customerInfo.specialRequest}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, specialRequest: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-amber-900/75 mt-1">
                  Indiquez-nous toute demande particulière pour rendre votre expérience unique
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleConfirm}
                disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || submitting}
              >
                {submitting ? "Enregistrement..." : "Confirmer la réservation"}
              </Button>
              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
        <MobileBottomNav />
      </PageShell>
    )
  }

  return (
    <PageShell contentClassName="pb-20 lg:pb-0">
      <SiteHeader backHref="/" />

      <PageHero
        imageSrc={SITE.images.interior}
        imageAlt="Salle du restaurant"
        kicker="Sur place"
        title="Réserver une table"
        subtitle="Choisissez date, heure et emplacement — nous préparons votre accueil."
        height="sm"
      />

      <div className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {isReturningCustomer && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-50/80 px-5 py-3 dark:border-amber-700/30 dark:bg-amber-950/30">
            <Gift className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Bienvenue a nouveau !</p>
              <p className="text-xs text-amber-800/70 dark:text-amber-300/70">En tant que client fidele, profitez d&apos;un dessert offert sur votre prochaine reservation.</p>
            </div>
          </div>
        )}

        {suggestedTable && !selectedTable && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-50/80 px-5 py-3 dark:border-emerald-700/30 dark:bg-emerald-950/30">
            <Zap className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Table suggeree automatiquement</p>
              <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
                Table n°{suggestedTable.number} ({zones.find((z) => z.id === suggestedTable.zone)?.name}) — capacite {suggestedTable.capacity} personnes, ideale pour votre groupe.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedTable(suggestedTable)}>
              Accepter
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* Left Column - Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Date et heure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <Label>Heure</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Nombre de personnes</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Button variant="outline" size="icon" onClick={() => setGuests(Math.max(1, guests - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{guests}</span>
                    <Button variant="outline" size="icon" onClick={() => setGuests(Math.min(10, guests + 1))}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zone Selection Card */}
            <Card>
              <CardHeader>
                <CardTitle>Choisissez votre zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {zones.map((zone) => {
                    const active = selectedZone === zone.id
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => setSelectedZone(active ? "" : zone.id)}
                        aria-pressed={active}
                        className={`group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all duration-300 ${
                          active
                            ? "border-[color:var(--lux-gold)] bg-gradient-to-br from-[color:var(--lux-cream)] to-white shadow-[0_10px_28px_-15px_rgba(201,162,76,0.5)]"
                            : "border-amber-900/15 bg-white/80 hover:-translate-y-0.5 hover:border-[color:var(--lux-gold)]/50 hover:shadow-md"
                        }`}
                      >
                        <div className="mb-2 text-3xl">{zone.icon}</div>
                        <h3 className="font-display text-base font-semibold text-amber-950">
                          {zone.name}
                        </h3>
                        <p className="text-xs text-amber-900/70">{zone.description}</p>
                        {active ? (
                          <span
                            aria-hidden
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[color:var(--lux-ink)] shadow"
                            style={{ background: "var(--lux-gradient-gold)" }}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                {selectedZone && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedZone("")} className="mt-3 w-full">
                    Afficher toutes les zones
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Table Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Plan de salle {selectedZone && `- ${zones.find((z) => z.id === selectedZone)?.name}`}</span>
                  <div className="flex items-center gap-3 text-sm font-normal">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400" />
                      <span className="text-amber-900/75">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-200 border-2 border-orange-400" />
                      <span className="text-amber-900/75">Réservé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-400" />
                      <span className="text-amber-900/75">Occupé</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative min-h-[420px] overflow-hidden rounded-2xl border border-amber-900/10 p-8 shadow-inner"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg, color-mix(in srgb, var(--lux-cream) 90%, white) 0 18px, color-mix(in srgb, var(--lux-sand) 70%, white) 18px 19px), color-mix(in srgb, var(--lux-cream) 80%, white)",
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[color:var(--lux-gold)]/15 blur-3xl"
                  />
                  {filteredTables.map((table) => (
                    <button
                      key={table.id}
                      aria-label={`Table ${table.number} - ${table.capacity} personnes - ${table.status}`}
                      className={`absolute border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${getTableSize(table.type)} ${getTableColor(table)}`}
                      style={{ left: `${table.x}px`, top: `${table.y}px` }}
                      onClick={() => handleTableSelect(table)}
                      disabled={
                        table.status !== "available" ||
                        table.capacity < guests ||
                        (selectedZone ? table.zone !== selectedZone : false)
                      }
                    >
                      <span className="font-bold text-sm">{table.number}</span>
                      <Users className="w-4 h-4" />
                      <span className="text-xs">{table.capacity}</span>
                    </button>
                  ))}

                  {/* Restaurant Elements */}
                  <div className="absolute bottom-4 right-4 rounded-xl bg-amber-950/85 px-4 py-2 text-sm font-medium text-amber-50 shadow-md backdrop-blur">
                    🍷 Bar
                  </div>
                  <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl bg-amber-950/85 px-4 py-2 text-sm font-medium text-amber-50 shadow-md backdrop-blur">
                    Entrée
                  </div>
                </div>

                {selectedTable && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-2xl border border-[color:var(--lux-gold)]/40 p-4 shadow-[0_10px_25px_-15px_rgba(201,162,76,0.45)]"
                    style={{
                      background:
                        "linear-gradient(135deg, color-mix(in srgb, var(--lux-cream) 92%, white), white)",
                    }}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--lux-ink)] shadow-md"
                      style={{ background: "var(--lux-gradient-gold)" }}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-amber-950">
                        Table n°{selectedTable.number} sélectionnée
                      </p>
                      <p className="text-xs text-amber-900/70">
                        Zone {zones.find((z) => z.id === selectedTable.zone)?.name} • Capacité{" "}
                        {selectedTable.capacity} personnes
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[color:var(--lux-gold)] mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900/75">Date</p>
                      <p className="font-medium">{selectedDate || "Non sélectionnée"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[color:var(--lux-gold)] mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900/75">Heure</p>
                      <p className="font-medium">{selectedTime || "Non sélectionnée"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-[color:var(--lux-gold)] mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900/75">Personnes</p>
                      <p className="font-medium">{guests}</p>
                    </div>
                  </div>
                  {selectedZone && (
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{zones.find((z) => z.id === selectedZone)?.icon}</span>
                      <div>
                        <p className="text-sm text-amber-900/75">Zone</p>
                        <p className="font-medium">{zones.find((z) => z.id === selectedZone)?.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[color:var(--lux-gold)] mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900/75">Table</p>
                      <p className="font-medium">{selectedTable ? `N°${selectedTable.number}` : "Non sélectionnée"}</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleContinue}
                  disabled={!selectedDate || !selectedTime || !selectedTable}
                >
                  Continuer
                </Button>

                <div className="pt-4 border-t border-[color:var(--lux-gold)]/25 space-y-2 text-sm text-amber-900/75">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${SITE.contact.phoneE164}`} className="hover:text-amber-950">
                      {SITE.contact.phoneDisplay}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${SITE.contact.email}`} className="hover:text-amber-950">
                      {SITE.contact.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AIAgentBadge context="events" />
      <SiteFooter />
      <MobileBottomNav />
    </PageShell>
  )
}
