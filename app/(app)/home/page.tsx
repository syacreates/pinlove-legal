'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Link2, MapPin, ChevronRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useAppStore } from '@/stores/app.store'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { FreemiumBar } from '@/components/ui/FreemiumBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ROUTES, FREE_PLAN_LIMIT } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const places    = usePlacesStore(s => s.places)
  const loading   = usePlacesStore(s => s.loading)
  const count     = usePlacesStore(s => s.placesCount)
  const loadPlaces = usePlacesStore(s => s.loadPlaces)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPlaces(user.id)
  }, [user.id, loadPlaces])

  const recentPlaces = places.slice(0, 4)
  const isPremium    = user.plan === 'premium'
  const isAtLimit    = !isPremium && count >= FREE_PLAN_LIMIT

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Bonjour 👋</p>
          <h1 className="text-xl font-bold text-neutral-900">{user.full_name.split(' ')[0]}</h1>
        </div>
        <Link href={ROUTES.PROFILE}>
          <Avatar src={user.avatar_url} alt={user.full_name} size="md" />
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un lieu..."
          className="w-full bg-white rounded-2xl shadow-card px-4 py-3 pl-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
          onFocus={() => router.push(ROUTES.PLACES)}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          emoji="🔗"
          title="Importer un lien"
          sub="TikTok ou Instagram"
          href={ROUTES.IMPORT}
          accent
        />
        <QuickAction
          emoji="📍"
          title="Ajouter manuellement"
          sub="Saisie rapide"
          href={ROUTES.ADD}
        />
      </div>

      {/* Stats bar */}
      {!isPremium && (
        <FreemiumBar count={count} />
      )}

      {isPremium && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-3xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Plan Premium actif ✦</p>
            <p className="text-white/80 text-xs">{count} adresses enregistrées · illimité</p>
          </div>
        </div>
      )}

      {/* Map teaser */}
      <Link href={ROUTES.MAP} className="block relative h-36 bg-neutral-200 rounded-3xl overflow-hidden shadow-card group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/60 to-blue-600/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
          <MapPin className="w-6 h-6 mb-1 drop-shadow" />
          <p className="font-semibold text-base drop-shadow">Voir sur la carte</p>
          <p className="text-xs text-white/80 mt-0.5">{count} lieu{count > 1 ? 'x' : ''} enregistré{count > 1 ? 's' : ''}</p>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        {/* Decorative dots */}
        <div className="absolute top-4 left-8 w-2 h-2 bg-white/60 rounded-full" />
        <div className="absolute top-10 left-20 w-2.5 h-2.5 bg-brand-300 rounded-full" />
        <div className="absolute bottom-8 right-12 w-2 h-2 bg-white/60 rounded-full" />
        <div className="absolute top-6 right-8 w-3 h-3 bg-brand-400 rounded-full" />
      </Link>

      {/* Recent places */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">Derniers lieux</h2>
          <Link href={ROUTES.PLACES} className="flex items-center text-sm text-brand-500 font-medium">
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : recentPlaces.length === 0 ? (
          <EmptyState
            icon="📍"
            title="Aucun lieu enregistré"
            description="Importe ton premier spot depuis TikTok, Instagram ou ajoute-le manuellement."
            action={{ label: 'Importer un lien', onClick: () => router.push(ROUTES.IMPORT) }}
            secondaryAction={{ label: 'Ajouter manuellement', onClick: () => router.push(ROUTES.ADD) }}
          />
        ) : (
          <div className="space-y-3">
            {recentPlaces.map(p => (
              <PlaceCard key={p.id} place={p} />
            ))}
            {places.length > 4 && (
              <Link
                href={ROUTES.PLACES}
                className="block text-center text-sm text-brand-500 font-medium py-3"
              >
                Voir les {places.length - 4} autres lieux →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Upsell if at limit */}
      {isAtLimit && (
        <Link
          href={ROUTES.PRICING}
          className="block bg-gradient-to-r from-brand-500 to-brand-400 rounded-3xl p-5 text-center"
        >
          <p className="text-white font-bold text-base mb-1">🚀 Passe en Premium</p>
          <p className="text-white/85 text-sm">Adresses illimitées + partage avec tes amis</p>
          <div className="mt-3 inline-block bg-white text-brand-600 text-sm font-semibold px-4 py-2 rounded-2xl">
            Voir l'offre →
          </div>
        </Link>
      )}
    </div>
  )
}

function QuickAction({
  emoji, title, sub, href, accent = false,
}: {
  emoji: string
  title: string
  sub: string
  href: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-1.5 p-4 rounded-3xl shadow-card transition-all duration-150 active:scale-95 hover:shadow-card-hover ${
        accent
          ? 'bg-brand-500 text-white'
          : 'bg-white text-neutral-900'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className={`font-semibold text-sm leading-tight ${accent ? 'text-white' : 'text-neutral-900'}`}>
        {title}
      </span>
      <span className={`text-xs ${accent ? 'text-white/80' : 'text-neutral-400'}`}>{sub}</span>
    </Link>
  )
}
