"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  estimateEtaMinutes,
  type DeliveryTracking,
  type DeliveryStatus,
  type GeoPoint,
} from "@/lib/delivery/types"

const STORAGE_KEY = "jb-deliveries"

/**
 * Restaurant (point de départ livraisons / carte). Aligné sur SITE.address — Erfurt, Thüringen.
 */
export const RESTAURANT_LOCATION: GeoPoint = { lat: 50.9792, lng: 11.0325 }

/**
 * Seed de livraisons demo pour faire vivre l'interface sans backend.
 * Utilise si localStorage est vide.
 */
function seedDemoDeliveries(): DeliveryTracking[] {
  const now = Date.now()
  const mkIso = (minusMin: number) =>
    new Date(now - minusMin * 60_000).toISOString()

  return [
    {
      id: "dlv-001",
      order_id: "ord-1001",
      order_number: "1001",
      driver_id: "drv-me",
      driver_name: "Mohamed Karim",
      driver_phone: "+216 22 111 222",
      driver_rating: 4.9,
      customer_name: "Sara Ben Ali",
      customer_phone: "+216 98 765 432",
      delivery_address: "Mozartstraße 10, 99084 Erfurt",
      delivery_notes: "Interphone : Ben Ali. 3ᵉ étage.",
      pickup_location: RESTAURANT_LOCATION,
      delivery_location: { lat: 50.975, lng: 11.018 },
      driver_location: { lat: 50.977, lng: 11.026 },
      status: "en_route",
      payment_status: "cash_on_delivery",
      total_amount: 47.5,
      created_at: mkIso(22),
      assigned_at: mkIso(18),
      picked_up_at: mkIso(8),
      en_route_at: mkIso(7),
      items: [
        { name: "Pizza Margherita", quantity: 1 },
        { name: "Shawarma Poulet", quantity: 2 },
        { name: "Coca-Cola", quantity: 2 },
      ],
    },
    {
      id: "dlv-002",
      order_id: "ord-1002",
      order_number: "1002",
      driver_id: "drv-me",
      driver_name: "Mohamed Karim",
      driver_phone: "+216 22 111 222",
      customer_name: "Ahmed Kacem",
      customer_phone: "+216 55 123 456",
      delivery_address: "Anger 14, 99084 Erfurt",
      pickup_location: RESTAURANT_LOCATION,
      delivery_location: { lat: 50.9775, lng: 11.037 },
      status: "assigned",
      payment_status: "paid",
      total_amount: 32.9,
      created_at: mkIso(6),
      assigned_at: mkIso(2),
      items: [
        { name: "Manakish Zaatar", quantity: 3 },
        { name: "Limonade Maison", quantity: 1 },
      ],
    },
    {
      id: "dlv-003",
      order_id: "ord-1003",
      order_number: "1003",
      customer_name: "Yassine Mabrouk",
      customer_phone: "+216 97 654 321",
      delivery_address: "Juri-Gagarin-Ring 34, 99084 Erfurt",
      pickup_location: RESTAURANT_LOCATION,
      delivery_location: { lat: 50.972, lng: 11.028 },
      status: "pending",
      payment_status: "cash_on_delivery",
      total_amount: 28.0,
      created_at: mkIso(3),
      items: [{ name: "Burger Classic", quantity: 2 }],
    },
  ]
}

function load(): DeliveryTracking[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = seedDemoDeliveries()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as DeliveryTracking[]
  } catch {
    return []
  }
}

function save(items: DeliveryTracking[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useDeliveryTracking() {
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>(load)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    save(deliveries)
  }, [deliveries])

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setDeliveries(JSON.parse(e.newValue))
          setLastEvent("EXTERNAL_UPDATE")
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const updateStatus = useCallback(
    (deliveryId: string, status: DeliveryStatus) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id !== deliveryId) return d
          const now = new Date().toISOString()
          const updates: Partial<DeliveryTracking> = { status }
          if (status === "assigned" && !d.assigned_at) updates.assigned_at = now
          if (status === "picked_up" && !d.picked_up_at) updates.picked_up_at = now
          if (status === "en_route" && !d.en_route_at) updates.en_route_at = now
          if (status === "delivered" && !d.delivered_at) updates.delivered_at = now
          return { ...d, ...updates }
        }),
      )
      setLastEvent(`STATUS_${status.toUpperCase()}`)
    },
    [],
  )

  const updateDriverLocation = useCallback(
    (deliveryId: string, location: GeoPoint) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id !== deliveryId) return d
          const estimated_minutes = estimateEtaMinutes(location, d.delivery_location)
          return { ...d, driver_location: location, estimated_minutes }
        }),
      )
    },
    [],
  )

  const assignDriver = useCallback(
    (
      deliveryId: string,
      driver: { id: string; name: string; phone?: string; rating?: number },
    ) => {
      setDeliveries((prev) =>
        prev.map((d) => {
          if (d.id !== deliveryId) return d
          return {
            ...d,
            driver_id: driver.id,
            driver_name: driver.name,
            driver_phone: driver.phone,
            driver_rating: driver.rating,
            status: "assigned",
            assigned_at: new Date().toISOString(),
          }
        }),
      )
      setLastEvent("ASSIGNED")
    },
    [],
  )

  const getById = useCallback(
    (id: string) => deliveries.find((d) => d.id === id || d.order_id === id),
    [deliveries],
  )

  const getByDriver = useCallback(
    (driverId: string) => deliveries.filter((d) => d.driver_id === driverId),
    [deliveries],
  )

  return {
    deliveries,
    updateStatus,
    updateDriverLocation,
    assignDriver,
    getById,
    getByDriver,
    lastEvent,
  }
}
