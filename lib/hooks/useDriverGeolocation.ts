"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GeoPoint } from "@/lib/delivery/types"

export type GeoStatus = "idle" | "requesting" | "tracking" | "error" | "denied"

export type UseDriverGeolocationOptions = {
  /** Auto-demarrer le tracking au mount */
  autoStart?: boolean
  /** Fallback si l'utilisateur refuse la geolocalisation */
  fallback?: GeoPoint
  /** Callback a chaque update de position */
  onUpdate?: (point: GeoPoint) => void
  /** Intervalle minimal entre deux updates (ms). Default: 3000 */
  minInterval?: number
}

/**
 * Suit la position du livreur en temps reel via navigator.geolocation.
 * Simulation transparente si permission refusee.
 */
export function useDriverGeolocation({
  autoStart = false,
  fallback,
  onUpdate,
  minInterval = 3000,
}: UseDriverGeolocationOptions = {}) {
  const [status, setStatus] = useState<GeoStatus>("idle")
  const [position, setPosition] = useState<GeoPoint | null>(fallback ?? null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current)
      } catch {
        /* ignore */
      }
      watchIdRef.current = null
    }
    setStatus("idle")
  }, [])

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error")
      setError("Geolocalisation non supportee par ce navigateur")
      return
    }
    setStatus("requesting")
    setError(null)

    const onSuccess: PositionCallback = (pos) => {
      const now = Date.now()
      if (now - lastUpdateRef.current < minInterval) return
      lastUpdateRef.current = now
      const point: GeoPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }
      setPosition(point)
      setStatus("tracking")
      onUpdateRef.current?.(point)
    }

    const onError: PositionErrorCallback = (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        setStatus("denied")
        setError("Permission refusee")
      } else {
        setStatus("error")
        setError(err.message)
      }
      if (fallback) setPosition(fallback)
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        },
      )
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }, [minInterval, fallback])

  useEffect(() => {
    if (autoStart) start()
    return stop
  }, [autoStart, start, stop])

  return { status, position, error, start, stop }
}

/**
 * Simulation de deplacement pour demo (sans geolocalisation reelle).
 * Le livreur se deplace vers la destination.
 */
export function useSimulatedMovement(
  from: GeoPoint | null | undefined,
  to: GeoPoint,
  options: { enabled?: boolean; speed?: number; onUpdate?: (p: GeoPoint) => void } = {},
) {
  const { enabled = false, speed = 0.05, onUpdate } = options
  const [point, setPoint] = useState<GeoPoint | null>(from ?? null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  })

  useEffect(() => {
    if (from) setPoint(from)
  }, [from])

  useEffect(() => {
    if (!enabled || !point) return
    const interval = setInterval(() => {
      setPoint((prev) => {
        if (!prev) return prev
        const next: GeoPoint = {
          lat: prev.lat + (to.lat - prev.lat) * speed,
          lng: prev.lng + (to.lng - prev.lng) * speed,
        }
        onUpdateRef.current?.(next)
        return next
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [enabled, to.lat, to.lng, speed, point])

  return point
}
