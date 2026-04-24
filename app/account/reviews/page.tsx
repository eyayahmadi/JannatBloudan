"use client"

import { useState, useRef } from "react"
import { Star, Camera, Send } from "lucide-react"
import { AccountSubLayout } from "@/components/site/AccountSubLayout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function ReviewsPage() {
  const [rating, setRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [review, setReview] = useState("")
  const [photoName, setPhotoName] = useState<string>("")
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pastReviews = [
    {
      id: 1,
      dish: "Pizza Margherita",
      rating: 5,
      comment: "Excellente pizza! La pâte était parfaite.",
      date: "2024-01-15",
      image: "/pizza-margherita.png",
    },
    {
      id: 2,
      dish: "Burger Classic",
      rating: 4,
      comment: "Très bon burger, viande de qualité.",
      date: "2024-01-10",
      image: "/classic-burger.png",
    },
  ]

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-8 h-8 cursor-pointer transition-all ${
            star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  )

  const handleSend = () => {
    if (!rating || !serviceRating || !review.trim()) {
      setMessage("Merci de noter le plat, le service et de saisir un commentaire.")
      return
    }
    // Ici on appellerait Supabase pour persister l'avis (insert dans reviews + upload image si besoin).
    setMessage("Avis envoyé ! (simulation, à connecter à Supabase)")
    setRating(0)
    setServiceRating(0)
    setReview("")
    setPhotoName("")
  }

  return (
    <AccountSubLayout title="Avis & retours" subtitle="Votre mot compte : partagez votre expérience avec élégance.">
        {/* Write Review */}
        <Card className="mb-6 border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md animate-fade-up">
          <h2 className="text-xl font-bold mb-4">Donner un Avis</h2>
          {message && <div className="mb-3 text-sm text-center text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">{message}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Noter le plat</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Noter le service</label>
            <StarRating value={serviceRating} onChange={setServiceRating} />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Votre commentaire</label>
            <Textarea
              placeholder="Partagez votre expérience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setPhotoName(file ? file.name : "")
              }}
            />
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              {photoName ? `Photo: ${photoName}` : "Ajouter une photo"}
            </Button>
          </div>

          <Button size="pill" className="w-full" onClick={handleSend}>
            <Send className="w-4 h-4 mr-2" />
            Envoyer mon avis
          </Button>
        </Card>

        {/* Past Reviews */}
        <Card className="border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4">Mes Avis Précédents</h2>
          <div className="space-y-4">
            {pastReviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-4">
                  <img
                    src={rev.image || "/placeholder.svg"}
                    alt={rev.dish}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{rev.dish}</h3>
                      <div className="flex gap-1">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rev.comment}</p>
                    <p className="text-xs text-gray-500">
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
        </Card>
    </AccountSubLayout>
  )
}
