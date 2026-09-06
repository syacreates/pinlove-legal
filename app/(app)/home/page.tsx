'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, Sparkles, Heart, TrendingUp, Globe, Link2, Pin } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { FreemiumBar } from '@/components/ui/FreemiumBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { TicketCard } from '@/components/stamp/TicketCard'
import { StampBadge } from '@/components/stamp/StampBadge'
import { ROUTES, FREE_PLAN_LIMIT, PLACE_CATEGORIES } from '@/lib/constants'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { useRouter } from 'next/navigation'
import type { PlaceCategory } from '@/lib/types'

export default function HomePage() {
  const router         = useRouter()
  const user           = useAuthStore(s => s.user)!
  const places         = usePlacesStore(s => s.places)
  const loading        = usePlacesStore(s => s.loading)
  const count          = usePlacesStore(s => s.placesCount)
  const loadPlaces     = usePlacesStore(s => s.loadPlaces)
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite)

  useEffect(() => {
    loadPlaces(user.id)
  }, [user.id, loadPlaces])

  const recentPlaces   = places.slice(0, 4)
  const favoritePlaces = places.filter(p => p.is_favorite)
  const isPremium      = user.plan === 'premium'
  const isAtLimit      = !isPremium && count >= FREE_PLAN_LIMIT

  // Top 3 categories by count
  const topCategories = useMemo(() => {
    const counts: Partial<Record<PlaceCategory, number>> = {}
    for (const p of places) {
      counts[p.category] = (counts[p.category] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3) as [PlaceCategory, number][]
  }, [places])

  const firstName = user.full_name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="screen-scroll px-4 pt-6 pb-8 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StampBadge size="sm" animated={false} />
          <div>
            <p className="text-sm text-mist">{greeting} 👋</p>
            <h1 className="text-xl font-bold text-neutral-900">{firstName}</h1>
          </div>
        </div>
        <Link href={ROUTES.PROFILE}>
          <Avatar src={user.avatar_url} alt={user.full_name} size="md" />
        </Link>
      </div>

      {/* Search bar */}
      <button
        type="button"
        onClick={() => router.push(ROUTES.PLACES)}
        className="w-full flex items-center gap-3 bg-paper rounded-2xl shadow-card px-4 py-3 text-sm text-ink/40 hover:shadow-card-hover transition-shadow"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span>Rechercher un lieu...</span>
      </button>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction emoji="🔗" title="Importer un lien" sub="TikTok ou Instagram" href={ROUTES.IMPORT} accent />
        <QuickAction emoji="📍" title="Ajouter manuellement" sub="Saisie rapide" href={ROUTES.ADD} />
      </div>

      {/* Plan bar */}
      {!isPremium && <FreemiumBar count={count} />}

      {isPremium && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-400 rounded-3xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Plan Premium actif ✦</p>
            <p className="text-white/80 text-xs">{count} adresse{count > 1 ? 's' : ''} · illimité</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      {!loading && count > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Total" value={count} Icon={Pin} />
          <StatPill label="Favoris" value={favoritePlaces.length} Icon={Heart} />
          <StatPill label="Publics" value={places.filter(p => p.visibility === 'public').length} Icon={Globe} />
        </div>
      )}

      {/* Map teaser — fixed dark illustration (mirrors the real map's dark
          tile styling), independent of the site's light/dark theme. */}
      <Link href={ROUTES.MAP} data-theme="dark" className="block relative h-36 rounded-3xl overflow-hidden shadow-card group border border-dashed border-brass/25">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 18% 26%, rgba(231,179,74,.14), transparent 42%),' +
              'radial-gradient(circle at 84% 18%, rgba(230,59,119,.16), transparent 40%),' +
              'radial-gradient(circle at 68% 78%, rgba(231,179,74,.12), transparent 45%),' +
              '#153C42',
          }}
        />
        {/* Dashed route lines, matching the DA's postal-route motif */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 300 144" preserveAspectRatio="none">
          <path d="M0 40 C60 60 90 10 150 30 S 260 70 300 55" stroke="#E7B34A" strokeWidth="1.5" strokeDasharray="3 5" fill="none" />
          <path d="M0 110 C70 90 110 130 170 105 S 270 120 300 100" stroke="#E63B77" strokeWidth="1.5" strokeDasharray="3 5" fill="none" />
        </svg>
        {/* Decorative pin markers — postal-stamp dots, cerise/brass on paper ring */}
        <div className="absolute top-6 left-10 w-2.5 h-2.5 rounded-full bg-cerise border-2 border-paper shadow" />
        <div className="absolute top-11 left-28 w-3 h-3 rounded-full bg-brass border-2 border-paper shadow" style={{ boxShadow: '0 0 10px 1px rgba(231,179,74,.5)' }} />
        <div className="absolute bottom-9 right-16 w-2.5 h-2.5 rounded-full bg-cerise border-2 border-paper shadow" />
        <div className="absolute top-7 right-12 w-2.5 h-2.5 rounded-full bg-cerise border-2 border-paper shadow" />
        <div className="absolute bottom-6 left-16 w-2 h-2 rounded-full bg-surface-2 border border-brass-dim" />
        {/* Faint dotted grid, matching the map-canvas texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#F2ECD9 1px, transparent 1px), linear-gradient(90deg, #F2ECD9 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute inset-0 bg-petrol/10 group-hover:bg-petrol/25 transition-colors" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-paper text-center p-4">
          <MapPin className="w-6 h-6 mb-1 text-brass" />
          <p className="font-display font-bold uppercase text-base tracking-wide">Voir sur la carte</p>
          <p className="text-xs font-mono text-mist mt-0.5">
            {count} lieu{count > 1 ? 'x' : ''} enregistré{count > 1 ? 's' : ''}
          </p>
        </div>
      </Link>

      {/* Top categories */}
      {!loading && topCategories.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-neutral-900 text-sm">Tes catégories</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {topCategories.map(([cat, n]) => {
              const meta = PLACE_CATEGORIES[cat]
              return (
                <Link
                  key={cat}
                  href={`${ROUTES.PLACES}?category=${cat}`}
                  className="flex items-center gap-1.5 bg-paper text-ink rounded-2xl shadow-card px-3 py-2 text-sm hover:shadow-card-hover transition-shadow"
                >
                  <span>{meta.emoji}</span>
                  <span className="font-medium text-ink">{meta.label}</span>
                  <span className="text-brass-dim text-xs">{n}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Favorites */}
      {!loading && favoritePlaces.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-brand-500 text-brand-500" />
              <h2 className="font-semibold text-neutral-900">Mes favoris</h2>
            </div>
            <Link href={ROUTES.PLACES} className="flex items-center text-sm text-brand-500 font-medium">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {favoritePlaces.slice(0, 3).map(p => (
              <PlaceCard key={p.id} place={p} onToggleFavorite={id => toggleFavorite(id, user.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Recent places */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">Dernières adresses</h2>
          {places.length > 0 && (
            <Link href={ROUTES.PLACES} className="flex items-center text-sm text-brand-500 font-medium">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          )}
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
              <PlaceCard key={p.id} place={p} onToggleFavorite={id => toggleFavorite(id, user.id)} />
            ))}
            {places.length > 4 && (
              <Link href={ROUTES.PLACES} className="block text-center text-sm text-brand-500 font-medium py-3">
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
          <div className="mt-3 inline-block bg-paper text-ink text-sm font-semibold px-4 py-2 rounded-2xl">
            Voir l'offre →
          </div>
        </Link>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuickAction({
  emoji, title, sub, href, accent = false,
}: {
  emoji: string; title: string; sub: string; href: string; accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col gap-1.5 p-4 rounded-3xl shadow-card transition-all duration-150 active:scale-95 hover:shadow-card-hover ${
        accent ? 'bg-cerise text-paper' : 'bg-paper text-ink'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className={`font-semibold text-sm leading-tight ${accent ? 'text-white' : 'text-ink'}`}>
        {title}
      </span>
      <span className={`text-xs ${accent ? 'text-white/80' : 'text-ink/50'}`}>{sub}</span>
    </Link>
  )
}

function StatPill({
  label, value, Icon,
}: {
  label: string; value: number
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <TicketCard
      className="text-center"
      pinColors={[]}
      label={
        <span className="flex items-center justify-center gap-1.5">
          <Icon className="w-4 h-4 text-brass" />
          {value}
        </span>
      }
      sub={label}
    />
  )
}
