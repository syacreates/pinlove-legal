'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Navigation, Filter, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CategoryBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { mapService } from '@/services/map.service'
import type { Place, PlaceCategory, Coordinates } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES } from '@/lib/constants'
import { getCategoryMeta } from '@/lib/utils'

// Lazy-load the map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-neutral-200 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
  const [showFilters,   setShowFilters]   = useState(false)
  const [locating,      setLocating]      = useState(false)

  useEffect(() => {
    loadPlaces(user.id)
  }, [user.id, loadPlaces])

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

  function handleNavigate(place: Place) {
    const url = mapService.buildDirectionsUrl(
      { lat: place.latitude, lng: place.longitude },
      place.name,
      userPosition ?? undefined,
    )
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingBottom: 72 }}>
      {/* Filter bar */}
      <div className="absolute top-4 left-0 right-0 z-30 px-4 flex gap-2 items-center">
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar bg-white/90 backdrop-blur-sm rounded-2xl shadow-card p-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filterCategory ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
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
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterCategory === key ? 'bg-brand-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {val.emoji} {count}
              </button>
            )
          })}
        </div>
      </div>

      {/* Map */}
      <MapView
        places={filteredPlaces}
        userPosition={userPosition}
        onPlaceClick={setSelectedPlace}
        selectedPlace={selectedPlace}
        className="flex-1"
      />

      {/* Locate me button */}
      <div className="absolute bottom-6 right-4 z-30">
        <button
          onClick={locateUser}
          className={`w-12 h-12 bg-white rounded-2xl shadow-card flex items-center justify-center transition-all ${
            locating ? 'opacity-50' : 'hover:shadow-card-hover'
          }`}
          aria-label="Ma position"
          disabled={locating}
        >
          {locating ? (
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className={`w-5 h-5 ${userPosition ? 'text-brand-500' : 'text-neutral-500'}`} />
          )}
        </button>
      </div>

      {/* Geo error */}
      {geoError && (
        <div className="absolute bottom-20 left-4 right-4 z-30 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-800">{geoError}</p>
          <button onClick={() => setGeoError(null)} className="ml-auto flex-shrink-0">
            <X className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      )}

      {/* Selected place preview */}
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-white rounded-3xl shadow-modal p-4 animate-slide-up">
          <button
            onClick={() => setSelectedPlace(null)}
            className="absolute top-3 right-3 w-7 h-7 bg-neutral-100 rounded-full flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">{getCategoryMeta(selectedPlace.category).emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">{selectedPlace.name}</h3>
              <p className="text-xs text-neutral-500 truncate">{selectedPlace.address}, {selectedPlace.city}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              leftIcon={<Navigation className="w-3.5 h-3.5" />}
              onClick={() => handleNavigate(selectedPlace)}
            >
              Y aller
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => router.push(ROUTES.PLACE(selectedPlace.id))}
            >
              Voir le détail
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
