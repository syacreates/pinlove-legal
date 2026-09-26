'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, MapPin, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Card'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { MomentCard, SuggestionCard } from '@/components/rencontres/MomentCards'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { momentsService } from '@/services/moments.service'
import { RENCONTRE_INTENTIONS, ROUTES } from '@/lib/constants'
import { formatSlot } from '@/lib/utils'
import type { FeedMoment, Moment, PersonSuggestion } from '@/lib/types'

export default function RencontresPage() {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const places      = usePlacesStore(s => s.places)
  const profile     = useRencontreStore(s => s.profile)
  const loaded      = useRencontreStore(s => s.loaded)
  const loadProfile = useRencontreStore(s => s.loadProfile)

  const [feed,        setFeed]        = useState<FeedMoment[] | null>(null)
  const [suggestions, setSuggestions] = useState<PersonSuggestion[]>([])
  const [mine,        setMine]        = useState<Moment[]>([])

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])

  useEffect(() => {
    if (loaded && (!profile || !profile.principles_accepted_at)) {
      router.replace(ROUTES.RENCONTRES_ONBOARDING)
    }
  }, [loaded, profile, router])

  const active = !!profile?.enabled && !!profile.principles_accepted_at

  const loadFeed = useCallback(async () => {
    const [f, s, m] = await Promise.all([
      momentsService.getFeed(),
      momentsService.getSuggestions(),
      momentsService.getMyOpenMoments(user.id),
    ])
    setFeed(f)
    setSuggestions(s)
    setMine(m)
  }, [user.id])

  useEffect(() => { if (active) loadFeed() }, [active, loadFeed])

  if (!loaded || !profile || !profile.principles_accepted_at) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const openPlaces = places.filter(p => p.rencontre_open)
  const openCount  = openPlaces.length

  function proposeAt(placeKey: string) {
    const place = openPlaces.find(p => p.place_key === placeKey)
    router.push(`${ROUTES.RENCONTRES_NEW_MOMENT}${place ? `?place=${place.id}` : ''}`)
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      <ScreenHeader
        title="Rencontres"
        subtitle={`${profile.first_name} · ${RENCONTRE_INTENTIONS[profile.intention].label}`}
        back={false}
      />

      {!profile.enabled && (
        <div className="bg-accent-light rounded-card p-4 text-sm text-accent-dark">
          Le mode Rencontres est en pause : personne ne te voit. Tu peux le réactiver dans les réglages.
        </div>
      )}

      {profile.enabled && openCount === 0 && (
        <div className="bg-accent-light rounded-card p-4 text-sm text-accent-dark">
          Ouvre au moins un de tes lieux pour croiser des personnes qui l’aiment aussi.
        </div>
      )}

      {active && openCount > 0 && (
        <Button fullWidth size="lg" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push(ROUTES.RENCONTRES_NEW_MOMENT)}>
          Proposer un moment
        </Button>
      )}

      {/* Mes propositions en attente */}
      {active && mine.length > 0 && (
        <section>
          <h2 className="text-lg text-ink mb-2">Tes propositions</h2>
          <ul className="bg-paper rounded-card shadow-card divide-y divide-divider">
            {mine.map(m => (
              <li key={m.id}>
                <Link href={ROUTES.RENCONTRES_MOMENT(m.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-ink/5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate">{m.title}</p>
                    <p className="text-xs text-muted truncate">
                      {m.place_name} · {m.proposed_slots.map(formatSlot).join(' / ')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink/30 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Fil */}
      {active && (
        <section>
          <h2 className="text-lg text-ink mb-2">Moments dans tes lieux</h2>
          {feed === null ? (
            <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
          ) : feed.length === 0 ? (
            <div className="rounded-card border border-dashed border-dash p-5 text-center text-sm text-muted">
              Aucun moment pour l’instant dans tes lieux ouverts. Lance le premier !
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map(m => <MomentCard key={m.id} moment={m} />)}
            </div>
          )}
        </section>
      )}

      {/* Suggestions de personnes */}
      {active && suggestions.length > 0 && (
        <section>
          <h2 className="text-lg text-ink">Ils aiment tes lieux</h2>
          <p className="text-sm text-muted mb-2">Même intention que toi, au moins un lieu en commun.</p>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x">
            {suggestions.map((s, i) => (
              <div key={`${s.first_name}-${i}`} className="snap-start">
                <SuggestionCard suggestion={s} onPropose={proposeAt} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-paper rounded-card shadow-card divide-y divide-divider">
        <HubLink
          href={ROUTES.RENCONTRES_LIEUX}
          icon={<MapPin className="w-4 h-4" />}
          label="Mes lieux ouverts"
          detail={`${openCount} ouvert${openCount > 1 ? 's' : ''}`}
        />
        <HubLink
          href={ROUTES.RENCONTRES_REGLAGES}
          icon={<Settings className="w-4 h-4" />}
          label="Réglages Rencontres"
        />
      </div>
    </div>
  )
}

function HubLink({
  href,
  icon,
  label,
  detail,
}: {
  href: string
  icon: React.ReactNode
  label: string
  detail?: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-4 hover:bg-ink/5 transition-colors">
      <div className="w-8 h-8 bg-accent-light rounded-xl flex items-center justify-center text-accent">
        {icon}
      </div>
      <span className="flex-1 text-sm font-bold text-ink">{label}</span>
      {detail && <span className="text-xs text-muted">{detail}</span>}
      <ChevronRight className="w-4 h-4 text-ink/30" />
    </Link>
  )
}
