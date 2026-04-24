"use client"

import { useEffect, useMemo, useRef } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { GeoPoint } from "@/lib/delivery/types"
import { haversineKm } from "@/lib/delivery/types"

// Fix pour les icones par defaut de Leaflet avec Next/Webpack
// (le package ne resout pas les images correctement sans cela)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function createEmojiIcon(emoji: string, bg: string): L.DivIcon {
  return L.divIcon({
    className: "delivery-map-emoji-icon",
    html: `<div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${bg};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      font-size: 20px;
      line-height: 1;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  })
}

function createPulsingDriverIcon(): L.DivIcon {
  return L.divIcon({
    className: "delivery-map-driver-icon",
    html: `
      <div style="position: relative; width: 48px; height: 48px;">
        <div style="
          position: absolute;
          inset: 0;
          background: rgba(99, 102, 241, 0.35);
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          inset: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 16px rgba(99,102,241,0.5);
          font-size: 20px;
          line-height: 1;
        ">🛵</div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  })
}

export type DeliveryMapProps = {
  pickup: GeoPoint
  destination: GeoPoint
  driver?: GeoPoint | null
  pickupLabel?: string
  destinationLabel?: string
  driverLabel?: string
  className?: string
  /** Trace l'itineraire (ligne droite entre les 3 points) */
  showRoute?: boolean
  /** Hauteur en px (default 400) */
  height?: number
}

function FitBounds({
  points,
}: {
  points: GeoPoint[]
}) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [map, points])
  return null
}

export function DeliveryMap({
  pickup,
  destination,
  driver,
  pickupLabel = "Restaurant",
  destinationLabel = "Client",
  driverLabel = "Livreur",
  className,
  showRoute = true,
  height = 400,
}: DeliveryMapProps) {
  const center = useMemo<GeoPoint>(() => {
    if (driver) return driver
    return {
      lat: (pickup.lat + destination.lat) / 2,
      lng: (pickup.lng + destination.lng) / 2,
    }
  }, [pickup, destination, driver])

  const points = useMemo<GeoPoint[]>(() => {
    const list: GeoPoint[] = [pickup, destination]
    if (driver) list.push(driver)
    return list
  }, [pickup, destination, driver])

  const distanceKm = useMemo(() => {
    if (driver) return haversineKm(driver, destination)
    return haversineKm(pickup, destination)
  }, [pickup, destination, driver])

  const pickupIcon = useMemo(() => createEmojiIcon("🏪", "#10b981"), [])
  const destIcon = useMemo(() => createEmojiIcon("🏠", "#ef4444"), [])
  const driverIcon = useMemo(() => createPulsingDriverIcon(), [])

  // Route = ligne depuis le restaurant → livreur → client (si driver)
  // Sinon juste restaurant → client
  const routePath = useMemo<[number, number][]>(() => {
    if (driver) {
      return [
        [pickup.lat, pickup.lng],
        [driver.lat, driver.lng],
        [destination.lat, destination.lng],
      ]
    }
    return [
      [pickup.lat, pickup.lng],
      [destination.lat, destination.lng],
    ]
  }, [pickup, destination, driver])

  return (
    <div
      className={className}
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showRoute && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: "#6366f1",
              weight: 4,
              opacity: 0.6,
              dashArray: "8, 10",
            }}
          />
        )}

        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <strong>🏪 {pickupLabel}</strong>
          </Popup>
        </Marker>

        <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
          <Popup>
            <strong>🏠 {destinationLabel}</strong>
            <br />
            {distanceKm.toFixed(2)} km
          </Popup>
        </Marker>

        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <strong>🛵 {driverLabel}</strong>
              <br />
              {haversineKm(driver, destination).toFixed(2)} km du client
            </Popup>
          </Marker>
        )}

        <FitBounds points={points} />
      </MapContainer>
    </div>
  )
}

/**
 * Wrapper SSR-safe — la carte ne se charge que cote client.
 */
export function DeliveryMapSSR(props: DeliveryMapProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  if (typeof window === "undefined") {
    return (
      <div
        ref={ref}
        style={{
          height: props.height ?? 400,
          width: "100%",
          background: "#f1f5f9",
          borderRadius: 12,
        }}
      />
    )
  }
  return <DeliveryMap {...props} />
}
