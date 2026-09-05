'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Card'
import type { Place, PlaceCategory } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES } from '@/lib/constants'
import { CATEGORY_ICONS } from '@/lib/category-icons'

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

  useEffect(() => {
    loadPlaces(user.id)
  }, [user.id, loadPlaces])

  const searched = useMemo(() => {
    if (!search.trim()) return places
    const q = search.toLowerCase()
    return places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q),
    )
  }, [places, search])

  // Compte par catégorie (sur la recherche, pas le filtre catégorie) — sert
  // aux badges des puces et à savoir quelles sections grouper.
  const countByCategory = useMemo(() => {
    const counts: Partial<Record<PlaceCategory, number>> = {}
    for (const p of searched) counts[p.category] = (counts[p.category] ?? 0) + 1
    return counts
  }, [searched])

  // Sections groupées par catégorie (ordre de PLACE_CATEGORIES), uniquement
  // celles qui ont au moins un lieu — ou une seule section si une catégorie
  // est isolée via les puces.
  const sections = useMemo(() => {
    const cats = category ? [category] : CATEGORIES.map(c => c.value)
    return cats
      .filter(cat => (countByCategory[cat] ?? 0) > 0)
      .map(cat => ({
        category: cat,
        places: searched.filter(p => p.category === cat) as Place[],
      }))
  }, [category, countByCategory, searched])

  const totalVisible = sections.reduce((n, s) => n + s.places.length, 0)

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
          className="w-full bg-paper text-ink rounded-2xl shadow-card px-4 py-3 pl-11 text-sm placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brass/40"
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

      {/* Category filters — clique une catégorie pour l'isoler, reclique ou
          "Toutes" pour revenir à la vue groupée par catégorie. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-brand-500 text-white'
              : 'bg-paper text-ink/70 shadow-card'
          }`}
        >
          Toutes · {searched.length}
        </button>
        {CATEGORIES.map(c => {
          const Icon = CATEGORY_ICONS[c.value]
          const n = countByCategory[c.value] ?? 0
          if (n === 0) return null
          return (
            <button
              key={c.value}
              onClick={() => setCategory(category === c.value ? null : c.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-paper text-ink/70 shadow-card'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label} · {n}
            </button>
          )
        })}
      </div>

      {/* Results — sections groupées par catégorie */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : totalVisible === 0 ? (
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
        <div className="space-y-6">
          {sections.map(({ category: cat, places: catPlaces }) => {
            const meta = PLACE_CATEGORIES[cat]
            const Icon = CATEGORY_ICONS[cat]
            return (
              <section key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full border border-dashed border-brass-dim flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brass" />
                  </div>
                  <h2 className="font-display font-bold uppercase text-sm text-paper">{meta.label}</h2>
                  <span className="font-mono text-xs text-mist-2">{catPlaces.length}</span>
                </div>
                <div className="space-y-3">
                  {catPlaces.map(p => (
                    <PlaceCard key={p.id} place={p} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
