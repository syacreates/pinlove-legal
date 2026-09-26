'use client'

import Link from 'next/link'
import { CalendarDays, Clock, MapPin, Wallet } from 'lucide-react'
import { cn, formatDuration, formatSlot } from '@/lib/utils'
import { RENCONTRE_INTENTIONS, ROUTES } from '@/lib/constants'
import type { CommonPlace, FeedMoment, PersonSuggestion, RencontreIntention } from '@/lib/types'

// ── Petits éléments ──────────────────────────────────────────────────────────

export function IntentionTag({ intention }: { intention: RencontreIntention }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent-ink">
      {RENCONTRE_INTENTIONS[intention].label}
    </span>
  )
}

/** « Chacun sa part » : affiché sur toutes les cartes de moment. */
export function PaymentRule({ rule, className }: { rule: string; className?: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs text-muted', className)}>
      <Wallet className="w-3.5 h-3.5" /> {rule}
    </p>
  )
}

/** Lieux communs avec les deux « pourquoi ». `theirName` : prénom de l'autre personne. */
export function CommonPlacesList({
  places,
  theirName,
  exclude,
}: {
  places: CommonPlace[]
  theirName: string
  exclude?: string
}) {
  const shown = places.filter(p => p.place_key !== exclude)
  if (!shown.length) return null
  return (
    <ul className="space-y-2">
      {shown.map(p => (
        <li key={p.place_key} className="rounded-2xl bg-neutral-100 p-3 text-sm">
          <p className="font-bold text-neutral-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent" /> {p.place_name}
          </p>
          {p.their_why && (
            <p className="text-mist mt-1">
              <span className="text-muted">{theirName} : </span>« {p.their_why} »
            </p>
          )}
          {p.my_why && (
            <p className="text-mist mt-0.5">
              <span className="text-muted">Toi : </span>« {p.my_why} »
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── Carte d'un moment (fil) ──────────────────────────────────────────────────

export function MomentCard({ moment }: { moment: FeedMoment }) {
  const others = moment.common_places.filter(p => p.place_key !== moment.place_key)
  return (
    <Link
      href={ROUTES.RENCONTRES_MOMENT(moment.id)}
      className="block bg-surface rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg text-neutral-900 leading-snug">{moment.title}</h3>
          <p className="text-sm text-mist flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="truncate">{moment.place_name}</span>
          </p>
        </div>
        <IntentionTag intention={moment.intention} />
      </div>

      {moment.creator_why && (
        <p className="text-sm text-mist mt-3">
          <span className="font-bold text-neutral-900">{moment.creator_first_name}</span> aime ce lieu pour
          « {moment.creator_why} »
        </p>
      )}
      {!moment.creator_why && (
        <p className="text-sm text-mist mt-3">
          Proposé par <span className="font-bold text-neutral-900">{moment.creator_first_name}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {moment.proposed_slots.map(slot => (
          <span
            key={slot}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border',
              moment.my_chosen_slot && new Date(slot).getTime() === new Date(moment.my_chosen_slot).getTime()
                ? 'border-accent bg-accent/10 text-accent-ink'
                : 'border-line text-mist',
            )}
          >
            {formatSlot(slot)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <p className="text-xs text-muted flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {formatDuration(moment.duration_min)}
          {others.length > 0 && <> · {others.length} autre{others.length > 1 ? 's' : ''} lieu{others.length > 1 ? 'x' : ''} en commun</>}
        </p>
        <PaymentRule rule={moment.payment_rule} />
      </div>

      {moment.my_chosen_slot && (
        <p className="text-xs font-bold text-accent mt-3 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" /> Tu as proposé ce créneau : réponse en attente
        </p>
      )}
    </Link>
  )
}

// ── Suggestion de personne ───────────────────────────────────────────────────

export function SuggestionCard({
  suggestion,
  onPropose,
}: {
  suggestion: PersonSuggestion
  /** Proposer un moment dans un lieu commun (clé du lieu) */
  onPropose: (placeKey: string) => void
}) {
  const best = suggestion.common_places[0]
  return (
    <div className="bg-surface rounded-card shadow-card p-4 w-[280px] flex-shrink-0 flex flex-col">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-display text-lg flex items-center justify-center" aria-hidden>
          {suggestion.first_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-neutral-900 truncate">{suggestion.first_name}</p>
          <p className="text-xs text-muted">
            {suggestion.common_places.length} lieu{suggestion.common_places.length > 1 ? 'x' : ''} en commun
          </p>
        </div>
      </div>
      <div className="mt-3 flex-1">
        <CommonPlacesList places={suggestion.common_places.slice(0, 2)} theirName={suggestion.first_name} />
      </div>
      {best && (
        <button
          type="button"
          onClick={() => onPropose(best.place_key)}
          className="mt-3 text-sm font-bold text-accent text-left"
        >
          Proposer un moment à {best.place_name} →
        </button>
      )}
    </div>
  )
}
