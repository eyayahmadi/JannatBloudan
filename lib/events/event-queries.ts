import { createClient } from "@/lib/supabase/server"

export type EventRowPublic = Record<string, unknown> & {
  id: string
}

export async function fetchEventPublicRow(eventId: string): Promise<EventRowPublic | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle()
    if (error || !data) return null
    return data as EventRowPublic
  } catch {
    return null
  }
}
