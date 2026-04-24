"use client"

import dynamic from "next/dynamic"
import type { DeliveryMapProps } from "./DeliveryMap"

/**
 * Wrapper client-only pour DeliveryMap.
 * Leaflet necessite `window`, donc on evite tout rendu SSR.
 */
const DeliveryMap = dynamic(
  () => import("./DeliveryMap").then((mod) => mod.DeliveryMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 400,
          width: "100%",
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Chargement de la carte…
      </div>
    ),
  },
)

export default function DeliveryMapDynamic(props: DeliveryMapProps) {
  return <DeliveryMap {...props} />
}
