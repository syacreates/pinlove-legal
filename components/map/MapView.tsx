'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Place, Coordinates } from '@/lib/types'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/design-tokens'

// ── Fix Leaflet default icon (Next.js issue) ──────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Postal-stamp pin marker ────────────────────────────────────────────────────
// Solid dot pin (encre par défaut, cerise + halo quand sélectionné), cerclé de blanc —
// remplace l'ancien emoji-dans-cercle. La catégorie reste visible dans SpotBottomSheet.
function createStampPin(isSelected = false): L.DivIcon {
  const box = isSelected ? 34 : 28
  const dot = isSelected ? 13 : 11
  const html = `
    <div style="width:${box}px;height:${box}px;display:flex;align-items:center;justify-content:center;">
      <div style="
        width:${dot}px;height:${dot}px;border-radius:50%;
        background:${isSelected ? colors.accent : colors.ink};
        border:2px solid ${colors.surface};
        box-shadow:${
          isSelected
            ? '0 0 0 6px rgba(200,36,63,.2), 0 4px 10px rgba(30,26,26,.25)'
            : '0 2px 6px rgba(30,26,26,.25)'
        };
        transition: all .25s;
      "></div>
    </div>
  `
  return L.divIcon({
    className: '',
    html,
    iconSize: [box, box],
    iconAnchor: [box / 2, box / 2],
  })
}

// ── Fly-to helper ─────────────────────────────────────────────────────────────
// map.flyTo() peut lever "Invalid LatLng object: (NaN, NaN)" si le conteneur
// Leaflet n'est pas encore mesuré (taille 0x0) au moment de l'appel — courant
// juste après le montage d'un import dynamique. On diffère au prochain repaint.
function FlyToSelected({ place }: { place: Place | null }) {
  const map = useMap()
  useEffect(() => {
    if (!place) return
    const frame = requestAnimationFrame(() => {
      map.flyTo([place.latitude, place.longitude], 15, { duration: 0.8 })
    })
    return () => cancelAnimationFrame(frame)
  }, [place, map])
  return null
}

function FlyToUser({ coords }: { coords: Coordinates | null }) {
  const map = useMap()
  useEffect(() => {
    if (!coords) return
    const frame = requestAnimationFrame(() => {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 0.8 })
    })
    return () => cancelAnimationFrame(frame)
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
    <div className={cn('relative', className)}>
      <MapContainer
        center={[DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]}
        zoom={DEFAULT_MAP_ZOOM}
        className="w-full h-full"
        zoomControl={false}
        style={{ zIndex: 10 }}
      >
        {/* Map tiles — OpenStreetMap standard (gratuit, sans clé, sans quota),
            assombri en CSS (.leaflet-tile-pane, globals.css) + teinté pétrole
            ci-dessous. CartoDB "dark_nolabels" abandonné : son service anonyme
            affiche un filigrane "API KEY REQUIRED" une fois le quota dépassé. */}
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
          const isSelected = selectedPlace?.id === place.id
          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={createStampPin(isSelected)}
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
            fillColor="#5DA9E0"
            fillOpacity={1}
            color={colors.surface}
            weight={3}
          />
        )}
      </MapContainer>

    </div>
  )
}
