'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Navigation, X, Search } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { SpotBottomSheet } from '@/components/stamp/SpotBottomSheet'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { mapService } from '@/services/map.service'
import type { Place, PlaceCategory, Coordinates } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES } from '@/lib/constants'

// Lazy-load the map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-petrol-soft flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brass border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function MapPage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const { places, loadPlaces } = usePlacesStore()

  const [userPosition, setUserPosition]   = useState<Coordinates | null>(null)
  const [geoError,     setGeoError]       = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [filterCategory, setFilterCategory] = useState<PlaceCategory | null>(null)
  const [showFilters,   setShowFilters]   = useState(true)
  const [locating,      setLocating]      = useState(false)

  const firstName = user.full_name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    loadPlaces(user.id)
    // Auto-request geolocation on map load
    locateUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const filteredPlaces = filterCategory
    ? places.filter(p => p.category === filterCategory)
    : places

  async function locateUser() {
    setLocating(true)
    const { coords, error } = await mapService.getCurrentPosition()
    setLocating(false)
    if (error) {
      setGeoError(error)
    } else {
      setUserPosition(coords)
      setGeoError(null)
    }
  }

  async function handleNavigate(place: Place) {
    const isNative = Capacitor.isNativePlatform()
    // Sur web, ouvre l'onglet immédiatement (même tick que le clic) pour éviter
    // le blocage popup — l'URL est fixée une fois prête. En natif (Capacitor),
    // la WebView ne supporte pas window.open() : on redirige directement, ce
    // qui laisse iOS/Android relayer le lien vers l'app Plans via universal link.
    const tab = isNative ? null : window.open('', '_blank')

    let pos = userPosition
    if (!pos) {
      setLocating(true)
      const { coords, error } = await mapService.getCurrentPosition()
      setLocating(false)
      if (!error) {
        setUserPosition(coords)
        setGeoError(null)
        pos = coords
      } else {
        setGeoError(error)
      }
    }
    const url = mapService.buildDirectionsUrl(
      { lat: place.latitude, lng: place.longitude },
      place.name,
      pos ?? undefined,
    )
    if (isNative) window.location.href = url
    else if (tab) tab.location.href = url
    else window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingBottom: 72 }}>
      {/* Greeting header */}
      <div className="absolute top-4 left-0 right-0 z-30 px-4 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wide text-mist-2">
          {greeting}
          <span className="block font-display font-extrabold uppercase text-neutral-900 text-[19px] leading-tight tracking-wide">
            {firstName} ✦
          </span>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="w-9 h-9 rounded-[10px] bg-petrol/90 border border-dashed border-brass flex items-center justify-center text-neutral-900 flex-shrink-0"
          aria-label="Filtrer"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="absolute top-[70px] left-0 right-0 z-30 px-4 flex gap-2 items-center animate-fade-in">
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar bg-surface/90 backdrop-blur-sm rounded-2xl shadow-card p-2 border border-dashed border-brass/25">
            <button
              onClick={() => setFilterCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
                !filterCategory ? 'bg-brass text-ink' : 'text-mist hover:bg-surface-2'
              }`}
            >
              Tous ({places.length})
            </button>
            {Object.entries(PLACE_CATEGORIES).map(([key, val]) => {
              const count = places.filter(p => p.category === key).length
              if (count === 0) return null
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(filterCategory === key as PlaceCategory ? null : key as PlaceCategory)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide transition-colors ${
                    filterCategory === key ? 'bg-brass text-ink' : 'text-mist hover:bg-surface-2'
                  }`}
                >
                  {val.emoji} {count}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Map */}
      <MapView
        places={filteredPlaces}
        userPosition={userPosition}
        onPlaceClick={setSelectedPlace}
        selectedPlace={selectedPlace}
        className="flex-1"
      />

      {/* Locate me button — hidden when a place preview is open to avoid overlap */}
      <div className={`absolute right-4 z-30 transition-all ${selectedPlace ? 'bottom-[220px]' : 'bottom-[88px]'}`}>
        <button
          onClick={locateUser}
          className={`w-12 h-12 bg-surface rounded-2xl shadow-card border border-dashed border-brass/30 flex items-center justify-center transition-all ${
            locating ? 'opacity-50' : 'hover:bg-surface-2'
          }`}
          aria-label="Ma position"
          disabled={locating}
        >
          {locating ? (
            <div className="w-5 h-5 border-2 border-brass border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className={`w-5 h-5 ${userPosition ? 'text-brass' : 'text-mist-2'}`} />
          )}
        </button>
      </div>

      {/* Geo error */}
      {geoError && (
        <div className="absolute bottom-[148px] left-4 right-4 z-30 bg-amber-950/60 border border-amber-500/40 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-amber-400 text-sm flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-200 font-mono">{geoError}</p>
          <button onClick={() => setGeoError(null)} className="ml-auto flex-shrink-0">
            <X className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      )}

      {/* Selected place preview */}
      {selectedPlace && (
        <SpotBottomSheet
          place={selectedPlace}
          onNavigate={() => handleNavigate(selectedPlace)}
          onViewDetail={() => router.push(ROUTES.PLACE(selectedPlace.id))}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  )
}
