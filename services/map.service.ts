/**
 * Map Service
 *
 * Geolocation and routing utilities.
 * In V1 routing uses a direct Google Maps / Apple Maps deep link.
 * Production: integrate Mapbox Directions API or Google Directions API.
 */

import type { Coordinates } from '@/lib/types'
import { DEFAULT_MAP_CENTER } from '@/lib/constants'

export const mapService = {
  /**
   * Get the user's current position via the browser Geolocation API.
   * Falls back to DEFAULT_MAP_CENTER (Paris) if permission is denied.
   */
  async getCurrentPosition(): Promise<{ coords: Coordinates; error: string | null }> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { coords: DEFAULT_MAP_CENTER, error: 'Géolocalisation non supportée.' }
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve({
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            error: null,
          })
        },
        err => {
          console.warn('[map] Geolocation error:', err.message)
          resolve({
            coords: DEFAULT_MAP_CENTER,
            error: err.code === 1
              ? 'Accès à ta position refusé. Active la géolocalisation dans tes réglages.'
              : 'Impossible de récupérer ta position.',
          })
        },
        { timeout: 8000, maximumAge: 60_000 },
      )
    })
  },

  /**
   * Build a navigation deep link to the place.
   * On mobile this opens Apple Maps (iOS) or Google Maps (Android/Desktop).
   */
  buildDirectionsUrl(
    destination: Coordinates,
    destinationName: string,
    userPosition?: Coordinates,
  ): string {
    const dest = `${destination.lat},${destination.lng}`
    const label = encodeURIComponent(destinationName)

    // Apple Maps format (works on iOS and macOS)
    const isApple =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent)

    if (isApple) {
      const origin = userPosition
        ? `saddr=${userPosition.lat},${userPosition.lng}&`
        : ''
      return `https://maps.apple.com/?${origin}daddr=${dest}&q=${label}`
    }

    // Google Maps (all other platforms)
    const origin = userPosition
      ? `origin=${userPosition.lat},${userPosition.lng}&`
      : ''
    return `https://www.google.com/maps/dir/?api=1&${origin}destination=${dest}&destination_place_name=${label}&travelmode=walking`
  },

  /**
   * Simulate route calculation for the in-app map.
   * Production: call Mapbox Directions API and return a GeoJSON LineString.
   */
  async calculateRoute(
    from: Coordinates,
    to: Coordinates,
  ): Promise<{
    distanceKm: number
    durationMin: number
    polyline: [number, number][]
  }> {
    await delay(600) // Simulate API call

    // Simple straight-line distance (demo only)
    const R = 6371
    const dLat = deg2rad(to.lat - from.lat)
    const dLng = deg2rad(to.lng - from.lng)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(from.lat)) * Math.cos(deg2rad(to.lat)) *
      Math.sin(dLng / 2) ** 2
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    // Walking: ~5 km/h average
    const durationMin = Math.round((distanceKm / 5) * 60)

    // Mock polyline: just from + to (in Leaflet [lat, lng] format)
    const polyline: [number, number][] = [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ]

    return { distanceKm, durationMin, polyline }
  },

  /**
   * Geocode an address string to coordinates via Nominatim (OpenStreetMap).
   * Free, no API key required. Rate limit: 1 req/s — fine for user-triggered calls.
   */
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    if (!address.trim()) return null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=fr`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PinLove App (contact@pinlove.app)' },
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) return null
      const results: { lat: string; lon: string }[] = await res.json()
      if (!results.length) return null
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
    } catch {
      return null
    }
  },
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
function deg2rad(deg: number): number { return deg * (Math.PI / 180) }
