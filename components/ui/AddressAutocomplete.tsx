'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AddressResult {
  address: string
  city: string
  postal_code: string
  country: string
  lat: number
  lng: number
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    suburb?: string
    county?: string
    state_district?: string
    state?: string
    postcode?: string
    country?: string
  }
}

interface AddressAutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect: (result: AddressResult) => void
  placeholder?: string
}

export function AddressAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Ex : 172 Boulevard Saint-Germain',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef                  = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PinLove App (contact@pinlove.app)' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return
      const data: NominatimResult[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      // Silently ignore network errors
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  function handleSelect(item: NominatimResult) {
    const addr = item.address
    const road = [addr.house_number, addr.road].filter(Boolean).join(' ')
    // Les lieux naturels (plages, parcs...) n'ont souvent pas de tag "city" dans
    // Nominatim — on retombe sur les découpages administratifs plus larges.
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality
      ?? addr.suburb ?? addr.county ?? addr.state_district ?? addr.state ?? ''

    onSelect({
      address:     road || item.display_name.split(',')[0],
      city,
      postal_code: addr.postcode ?? '',
      country:     addr.country ?? 'France',
      lat:         parseFloat(item.lat),
      lng:         parseFloat(item.lon),
    })
    onChange(road || item.display_name.split(',')[0])
    setSuggestions([])
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      {label && (
        <label className="text-sm font-medium text-neutral-700">{label}</label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-neutral-400 pointer-events-none">
          <MapPin className="w-4 h-4" />
        </span>
        <input
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            'w-full rounded-2xl bg-neutral-100 border border-transparent',
            'pl-10 pr-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400',
            'transition-all duration-150',
            'focus:outline-none focus:bg-surface-2 focus:border-brass focus:ring-2 focus:ring-brass/20',
          )}
        />
        {loading && (
          <span className="absolute right-3">
            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-paper rounded-2xl shadow-lg border border-brass-dim/30 overflow-hidden">
          {suggestions.map((item, i) => {
            const addr = item.address
            const road = [addr.house_number, addr.road].filter(Boolean).join(' ')
            const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality
              ?? addr.suburb ?? addr.county ?? addr.state_district ?? addr.state ?? ''
            const postcode = addr.postcode ?? ''
            return (
              <li
                key={i}
                onMouseDown={() => handleSelect(item)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-ink/5 border-b border-ink/10 last:border-0"
              >
                <MapPin className="w-4 h-4 text-cerise flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {road || item.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-ink/60 truncate">
                    {[postcode, city].filter(Boolean).join(' ')}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
