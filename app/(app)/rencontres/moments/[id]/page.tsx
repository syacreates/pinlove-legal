'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { CommonPlacesList, IntentionTag, PaymentRule } from '@/components/rencontres/MomentCards'
import { useAppStore } from '@/stores/app.store'
import { momentsService } from '@/services/moments.service'
import { ROUTES } from '@/lib/constants'
import { cn, formatDuration, formatSlot } from '@/lib/utils'
import type { MomentDetail } from '@/lib/types'

const sameInstant = (a: string | null, b: string | null) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime()

export default function MomentDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const addToast = useAppStore(s => s.addToast)

  const [moment,  setMoment]  = useState<MomentDetail | null | undefined>(undefined)
  const [slot,    setSlot]    = useState<string | null>(null)
  const [busy,    setBusy]    = useState(false)

  const load = useCallback(async () => {
    const m = await momentsService.getMoment(id)
    setMoment(m)
    setSlot(m?.my_chosen_slot ?? null)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleRequest() {
    if (!slot) { addToast({ type: 'error', message: 'Choisis un créneau.' }); return }
    setBusy(true)
    const { error } = await momentsService.requestSlot(id, slot)
    setBusy(false)
    if (error) { addToast({ type: 'error', message: error }); return }
    addToast({ type: 'success', message: 'C’est envoyé ! Tu seras prévenu·e si le moment est confirmé.' })
    load()
  }

  async function handleWithdraw() {
    setBusy(true)
    const { error } = await momentsService.withdrawRequest(id)
    setBusy(false)
    if (error) { addToast({ type: 'error', message: error }); return }
    addToast({ type: 'info', message: 'Ta demande est retirée.' })
    load()
  }

  const back = () => router.push(ROUTES.RENCONTRES)

  if (moment === undefined) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Introuvable, expiré, annulé : on ne dit jamais pourquoi (aucun rejet visible).
  if (moment === null || (moment.my_role !== 'creator' && ['expired', 'cancelled'].includes(moment.status))) {
    return (
      <div className="screen-scroll px-4 pt-6">
        <ScreenHeader title="Moment" onBack={back} />
        <div className="rounded-card border border-dashed border-dash p-6 text-center">
          <p className="font-bold text-ink">Ce moment n’est plus disponible.</p>
          <p className="text-sm text-muted mt-1">D’autres moments t’attendent dans tes lieux.</p>
          <Button className="mt-4" onClick={back}>Voir les moments</Button>
        </div>
      </div>
    )
  }

  const isCreator = moment.my_role === 'creator'
  const isOpen    = moment.status === 'open'
  const requested = !!moment.my_chosen_slot
  const future    = (s: string) => new Date(s).getTime() > Date.now() + 3600_000

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      <ScreenHeader title={moment.title} subtitle={isCreator ? 'Ta proposition' : `Proposé par ${moment.creator_first_name}`} onBack={back} />

      {/* Lieu */}
      <section className="bg-paper rounded-card shadow-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent flex-shrink-0" /> {moment.place_name}
            </p>
            {moment.place_address && <p className="text-sm text-muted mt-0.5">{moment.place_address}</p>}
          </div>
          <IntentionTag intention={moment.intention} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {formatDuration(moment.duration_min)}
          </p>
          <PaymentRule rule={moment.payment_rule} className="text-sm" />
        </div>
      </section>

      {/* Pourquoi ce lieu */}
      {!isCreator && (moment.creator_why || moment.common_places.length > 0) && (
        <section className="space-y-2">
          <h2 className="text-lg text-ink">Ce qui vous rapproche</h2>
          {moment.creator_why && (
            <p className="text-ink-soft">
              <span className="font-bold text-ink">{moment.creator_first_name}</span> aime {moment.place_name} pour
              « {moment.creator_why} »
            </p>
          )}
          <CommonPlacesList places={moment.common_places} theirName={moment.creator_first_name} exclude={moment.place_key} />
        </section>
      )}

      {/* Créneaux */}
      <section>
        <h2 className="text-lg text-ink mb-2">
          {isCreator || !isOpen ? 'Créneaux proposés' : requested ? 'Ton créneau' : 'Choisis un créneau'}
        </h2>
        <div className="space-y-2" role={!isCreator && isOpen ? 'radiogroup' : undefined}>
          {moment.proposed_slots.map(s => {
            const selectable = !isCreator && isOpen && future(s)
            const selected = sameInstant(slot, s)
            return (
              <button
                key={s}
                type="button"
                role={!isCreator && isOpen ? 'radio' : undefined}
                aria-checked={!isCreator && isOpen ? selected : undefined}
                disabled={!selectable}
                onClick={() => setSlot(s)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all',
                  selected ? 'border-accent bg-accent-light' : 'border-line bg-paper',
                  selectable ? 'hover:border-dash' : 'cursor-default',
                  !isCreator && isOpen && !future(s) && 'opacity-50',
                )}
              >
                <CalendarDays className={cn('w-4 h-4', selected ? 'text-accent' : 'text-muted')} />
                <span className="font-bold text-ink capitalize">{formatSlot(s)}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Actions */}
      {isCreator && isOpen && (
        <section className="rounded-card bg-paper shadow-card p-4 text-sm text-ink-soft space-y-1">
          <p className="font-bold text-ink">
            {moment.request_count
              ? `${moment.request_count} personne${moment.request_count > 1 ? 's' : ''} partante${moment.request_count > 1 ? 's' : ''}`
              : 'En attente de réponses'}
          </p>
          <p>Visible jusqu’au {formatSlot(moment.expires_at)} par les personnes de même intention qui aiment ce lieu. Sans réponse, il expire simplement.</p>
        </section>
      )}
      {isCreator && moment.status === 'expired' && (
        <p className="text-sm text-muted text-center">Ce moment a expiré. Tu peux en proposer un nouveau quand tu veux.</p>
      )}

      {!isCreator && isOpen && (
        <div className="space-y-2">
          <Button
            fullWidth
            size="xl"
            loading={busy}
            disabled={!slot || sameInstant(slot, moment.my_chosen_slot)}
            onClick={handleRequest}
          >
            {requested ? 'Changer de créneau' : 'Je suis partant·e'}
          </Button>
          {requested && (
            <>
              <p className="text-sm text-muted text-center">
                {moment.creator_first_name} doit valider. Sans réponse, le moment expirera simplement le {formatSlot(moment.expires_at)}.
              </p>
              <Button fullWidth variant="ghost" disabled={busy} onClick={handleWithdraw}>
                Retirer ma demande
              </Button>
            </>
          )}
          {!requested && (
            <p className="text-xs text-muted text-center">
              Pas de chat avant la rencontre : on se retrouve directement au lieu, au créneau choisi.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
