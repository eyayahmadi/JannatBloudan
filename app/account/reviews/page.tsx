"use client"

import { useState, useRef } from "react"
import {
  Star,
  Camera,
  Send,
  CheckCircle2,
  AlertCircle,
  X as XIcon,
  ImageIcon,
  Quote,
} from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const RATING_LABELS = ["", "Décevant", "Mitigé", "Bien", "Très bien", "Exceptionnel"]

type StarSize = "sm" | "md" | "lg"

const sizeClass: Record<StarSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9",
}

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "lg",
  ariaLabel,
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
  size?: StarSize
  ariaLabel?: string
}) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div
      className={cn("flex items-center gap-1.5", readOnly ? "" : "cursor-pointer")}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={ariaLabel}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          aria-pressed={star <= value}
          className={cn(
            "rounded transition-transform focus:outline-none",
            !readOnly && "hover:scale-110 focus-visible:ring-2 focus-visible:ring-amber-400",
            readOnly && "cursor-default",
          )}
        >
          <Star
            className={cn(
              sizeClass[size],
              "transition-colors",
              star <= display
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_3px_rgba(245,158,11,0.35)]"
                : "fill-amber-100 text-amber-200",
            )}
          />
        </button>
      ))}
      {!readOnly && size === "lg" && value > 0 ? (
        <span className="ml-2 text-sm font-medium text-amber-900/75">
          {RATING_LABELS[display] ?? ""}
        </span>
      ) : null}
    </div>
  )
}

export default function ReviewsPage() {
  const [rating, setRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [review, setReview] = useState("")
  const [photoName, setPhotoName] = useState<string>("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const charCount = review.length
  const maxChars = 500

  const pastReviews = [
    {
      id: 1,
      dish: "Pizza Margherita",
      rating: 5,
      comment: "Excellente pizza ! La pâte était parfaite, fromage fondant à souhait.",
      date: "2024-01-15",
      image: "/pizza-margherita.png",
    },
    {
      id: 2,
      dish: "Burger Classic",
      rating: 4,
      comment: "Très bon burger, viande de qualité, frites maison délicieuses.",
      date: "2024-01-10",
      image: "/classic-burger.png",
    },
  ]

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setPhotoName("")
      setPhotoPreview(null)
      return
    }
    setPhotoName(file.name)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSend = async () => {
    if (!rating || !serviceRating || !review.trim()) {
      setMessage({
        kind: "error",
        text: "Merci de noter le plat, le service et de saisir un commentaire.",
      })
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))
    setSubmitting(false)
    setMessage({ kind: "success", text: "Merci ! Votre avis a bien été envoyé." })
    setRating(0)
    setServiceRating(0)
    setReview("")
    setPhotoName("")
    setPhotoPreview(null)
    setTimeout(() => setMessage(null), 4500)
  }

  const avgRating =
    pastReviews.length === 0
      ? 0
      : pastReviews.reduce((s, r) => s + r.rating, 0) / pastReviews.length

  return (
    <AccountSubLayout
      title="Avis & retours"
      subtitle="Votre mot compte : partagez votre expérience avec élégance."
    >
      {/* Write Review */}
      <Card className="premium-card mb-6 p-6 sm:p-7 animate-fade-up">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
            <Star className="h-5 w-5" />
          </span>
          Donner un avis
        </h2>

        {message ? (
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm animate-fade-up",
              message.kind === "success"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                : "border-amber-200 bg-amber-50/80 text-amber-800",
            )}
          >
            {message.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        ) : null}

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-950">
              Noter le plat
            </label>
            <StarRating value={rating} onChange={setRating} ariaLabel="Note du plat" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-amber-950">
              Noter le service
            </label>
            <StarRating
              value={serviceRating}
              onChange={setServiceRating}
              ariaLabel="Note du service"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-amber-950">Votre commentaire</label>
              <span
                className={cn(
                  "text-xs",
                  charCount > maxChars * 0.9
                    ? "font-semibold text-orange-700"
                    : "text-amber-900/55",
                )}
              >
                {charCount}/{maxChars}
              </span>
            </div>
            <Textarea
              placeholder="Partagez votre expérience…"
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, maxChars))}
              maxLength={maxChars}
              className="min-h-[120px] border-amber-900/15 bg-white/90 focus:border-[color:var(--lux-gold)]/50 focus:ring-[color:var(--lux-gold)]/25"
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            {photoPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-amber-900/15">
                <img
                  src={photoPreview}
                  alt={photoName}
                  className="max-h-64 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handlePhotoChange(null)}
                  aria-label="Retirer la photo"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-amber-950 shadow-md backdrop-blur transition hover:bg-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs text-white">
                  <span className="flex items-center gap-1.5 truncate">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{photoName}</span>
                  </span>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-xl border-dashed border-amber-300/70 bg-amber-50/30 py-6 hover:bg-amber-50/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Ajouter une photo (facultatif)
              </Button>
            )}
          </div>

          <Button
            size="pill"
            variant="gold"
            className="w-full rounded-full py-6 text-base font-semibold"
            onClick={handleSend}
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                />
                Envoi…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Envoyer mon avis
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* Past Reviews */}
      <Card className="premium-card p-6 sm:p-7 animate-fade-up [animation-delay:160ms]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-amber-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100/80 text-rose-700">
              <Quote className="h-5 w-5" />
            </span>
            Mes avis précédents
          </h2>
          {pastReviews.length > 0 ? (
            <div className="flex items-center gap-2 rounded-full bg-amber-50/70 px-3 py-1.5 text-xs ring-1 ring-amber-200/60">
              <StarRating value={Math.round(avgRating)} readOnly size="sm" />
              <span className="font-semibold text-amber-900">
                {avgRating.toFixed(1)} / 5 · {pastReviews.length} avis
              </span>
            </div>
          ) : null}
        </div>

        {pastReviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200/70 bg-amber-50/30 p-10 text-center">
            <Star className="mx-auto mb-3 h-10 w-10 text-amber-700/60" />
            <p className="font-display text-base font-semibold text-amber-950">
              Aucun avis pour le moment
            </p>
            <p className="mt-1 text-sm text-amber-900/65">
              Partagez votre première expérience ci-dessus !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastReviews.map((rev) => (
              <div
                key={rev.id}
                className="group rounded-2xl border border-amber-900/10 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-900/15 hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col items-start gap-4 sm:flex-row">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-amber-900/10">
                    <img
                      src={rev.image || "/placeholder.svg"}
                      alt={rev.dish}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-amber-950">
                        {rev.dish}
                      </h3>
                      <StarRating value={rev.rating} readOnly size="sm" />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-amber-900/75">
                      <Quote className="mr-1 inline h-3 w-3 -translate-y-1 text-amber-300" />
                      {rev.comment}
                    </p>
                    <p className="mt-2 text-xs text-amber-900/50">
                      {new Date(rev.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AccountSubLayout>
  )
}
