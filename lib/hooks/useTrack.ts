"use client"

export function track(eventName: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return

  if (process.env.NODE_ENV === "development") {
    console.log(`[track] ${eventName}`, properties ?? "")
  }

  try {
    const va = (window as any).va
    if (typeof va?.track === "function") {
      va.track(eventName, properties)
    }
  } catch {
    // silently ignore analytics failures
  }
}
