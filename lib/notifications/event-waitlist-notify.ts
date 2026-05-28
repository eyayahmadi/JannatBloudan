import { createClient } from "@/lib/supabase/server"
import { hasServerSupabaseEnv } from "@/lib/supabase/config"

type NotifyPayload = {
  eventTitle?: string
  guestEmail: string
  guestPhone?: string
  message: string
  waitlistId: string
  eventId: string
}

/**
 * Couche notifications (demo) : journal DB + logs.
 * Brancher SendGrid / Twilio / WhatsApp Business via env sans modifier l’API métier.
 */
export async function logWaitlistOffer(p: NotifyPayload): Promise<void> {
  console.info("[waitlist-notify]", p.message, { to: p.guestEmail, eventId: p.eventId })

  if (!hasServerSupabaseEnv()) return
  try {
    const supabase = await createClient()
    await supabase.from("event_notification_log").insert({
      event_id: p.eventId,
      waitlist_id: p.waitlistId,
      channel: "stub",
      payload: {
        email: p.guestEmail,
        phone: p.guestPhone,
        message: p.message,
        title: p.eventTitle,
      },
    })
  } catch (e) {
    console.warn("[waitlist-notify] log skip", e)
  }
}
