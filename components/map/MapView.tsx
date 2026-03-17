'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Place, Coordinates } from '@/lib/types'
import { getCategoryMeta } from '@/lib/utils'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ── Fix Leaflet default icon (Next.js issue) ──────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom emoji marker ───────────────────────────────────────────────────────
function createEmojiIcon(emoji: string, isSelected = false): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        display: flex; align-items: center; justify-content: center;
        width: ${isSelected ? 44 : 36}px;
        height: ${isSelected ? 44 : 36}px;
        background: ${isSelected ? '#ff3d5a' : '#ffffff'};
        border: 2px solid ${isSelected ? '#ff3d5a' : '#e5e5ea'};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: ${isSelected ? 20 : 16}px;
        transition: all 0.2s;
      ">
        ${emoji}
      </div>
    `,
    iconSize:   [isSelected ? 44 : 36, isSelected ? 44 : 36],
    iconAnchor: [isSelected ? 22 : 18, isSelected ? 22 : 18],
  })
}

// ── Fly-to helper ─────────────────────────────────────────────────────────────
function FlyToSelected({ place }: { place: Place | null }) {
  const map = useMap()
  useEffect(() => {
    if (place) {
      map.flyTo([place.latitude, place.longitude], 15, { duration: 0.8 })
    }
  }, [place, map])
  return null
}

function FlyToUser({ coords }: { coords: Coordinates | null }) {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 0.8 })
    }
  }, [coords, map])
  return null
}

// ── Main MapView component ────────────────────────────────────────────────────
interface MapViewProps {
  places: Place[]
  userPosition: Coordinates | null
  selectedPlace: Place | null
  onPlaceClick: (place: Place) => void
  className?: string
}

export default function MapView({
  places,
  userPosition,
  selectedPlace,
  onPlaceClick,
  className,
}: MapViewProps) {
  return (
    <MapContainer
      center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      className={cn('w-full h-full', className)}
      zoomControl={false}
      style={{ zIndex: 10 }}
    >
      {/* Map tiles — OpenStreetMap (free, no API key required) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Fly to selected place */}
      <FlyToSelected place={selectedPlace} />
      <FlyToUser coords={userPosition} />

      {/* Place markers */}
      {places.map(place => {
        const meta       = getCategoryMeta(place.category)
        const isSelected = selectedPlace?.id === place.id
        return (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={createEmojiIcon(meta.emoji, isSelected)}
            eventHandlers={{ click: () => onPlaceClick(place) }}
            zIndexOffset={isSelected ? 1000 : 0}
          />
        )
      })}

      {/* User position */}
      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          fillColor="#3b82f6"
          fillOpacity={1}
          color="#ffffff"
          weight={3}
        />
      )}
    </MapContainer>
  )
}
