'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { placesService } from '@/services/places.service'
import type { PlaceCategory } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES } from '@/lib/constants'

const CATEGORIES = Object.entries(PLACE_CATEGORIES).map(([key, val]) => ({
  value: key as PlaceCategory,
  ...val,
}))

export default function PlacesPage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const { places, loading, loadPlaces } = usePlacesStore()

  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState<PlaceCategory | null>(null)
  const [filtered, setFiltered] = useState(places)

  useEffect(() => {
    loadPlaces(user.id)
  }, [user.id, loadPlaces])

  useEffect(() => {
    let res = places
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
      )
    }
    if (category) {
      res = res.filter(p => p.category === category)
    }
    setFiltered(res)
  }, [places, search, category])

  return (
    <div className="screen-scroll px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Mes lieux</h1>
        <span className="text-sm text-neutral-400">{places.length} lieux</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-white rounded-2xl shadow-card px-4 py-3 pl-11 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-brand-500 text-white'
              : 'bg-white text-neutral-600 shadow-card'
          }`}
        >
          Tous
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(category === c.value ? null : c.value)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c.value
                ? 'bg-brand-500 text-white'
                : 'bg-white text-neutral-600 shadow-card'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={search || category ? '🔍' : '📍'}
          title={search || category ? 'Aucun résultat' : 'Aucun lieu enregistré'}
          description={
            search || category
              ? 'Essaie un autre mot-clé ou supprime les filtres.'
              : 'Importe ton premier spot depuis un lien TikTok ou Instagram, ou ajoute-le manuellement.'
          }
          action={
            search || category
              ? { label: 'Effacer les filtres', onClick: () => { setSearch(''); setCategory(null) } }
              : { label: 'Ajouter un lieu', onClick: () => router.push(ROUTES.ADD) }
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </div>
      )}
    </div>
  )
}
