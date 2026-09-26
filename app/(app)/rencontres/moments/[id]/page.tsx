'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, Clock, Heart, MapPin, MessageCircle, Navigation, ShieldCheck, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { CommonPlacesList, IntentionTag, PaymentRule } from '@/components/rencontres/MomentCards'
import { ReportButton, ShareWithContactButton } from '@/components/rencontres/Safety'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { momentsService } from '@/services/moments.service'
import { rencontresService } from '@/services/rencontres.service'
import { mapService } from '@/services/map.service'
import { LATE_CANCEL_HOURS, ROUTES } from '@/lib/constants'
import { cn, formatDuration, formatSlot } from '@/lib/utils'
import type { MomentDetail, MomentOther, MomentRequest } from '@/lib/types'

const sameInstant = (a: string | null, b: string | null) =>
  !!a && !!b && new Date(a).getTime() === new Date(b).getTime()

export default function MomentDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const router      = useRouter()
  const addToast    = useAppStore(s => s.addToast)
  const user        = useAuthStore(s => s.user)!
  const loadProfile = useRencontreStore(s => s.loadProfile)

  const [moment,     setMoment]     = useState<MomentDetail | null | undefined>(undefined)
  const [slot,       setSlot]       = useState<string | null>(null)
  const [busy,       setBusy]       = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    const m = await momentsService.getMoment(id)
    setMoment(m)
    setSlot(m?.my_chosen_slot ?? null)
  }, [id])

  useEffect(() => { load() }, [load])

  async function run(action: () => Promise<{ error: string | null }>, success: string) {
    setBusy(true)
    const { error } = await action()
    setBusy(false)
    if (error) { addToast({ type: 'error', message: error }); return false }
    addToast({ type: 'success', message: success })
    await load()
    return true
  }

  async function handleCancel() {
    setBusy(true)
    const { penalized, error } = await momentsService.cancel(id)
    setBusy(false)
    setCancelOpen(false)
    if (error) { addToast({ type: 'error', message: error }); return }
    addToast({
      type: 'info',
      message: penalized ? 'Moment annulé. Moins de 12 h avant : ta fiabilité baisse de 10 points.' : 'Moment annulé.',
    })
    if (penalized) loadProfile(user.id)
    await load()
  }

  const back = () => router.push(ROUTES.RENCONTRES)

  if (moment === undefined) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isCreator = moment?.my_role === 'creator'
  const scheduled = !!moment?.scheduled_at

  // Introuvable, ou demande restée sans suite : on ne dit jamais pourquoi.
  if (moment === null || (!isCreator && !scheduled && ['expired', 'cancelled'].includes(moment.status))) {
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

  const isOpen    = moment.status === 'open'
  const isActive  = moment.status === 'matched' || moment.status === 'confirmed'
  const requested = !!moment.my_chosen_slot
  const future    = (s: string) => new Date(s).getTime() > Date.now() + 3600_000
  const lateCancel = scheduled && new Date(moment.scheduled_at!).getTime() - Date.now() < LATE_CANCEL_HOURS * 3600_000
  const directions = mapService.buildDirectionsUrl({ lat: moment.latitude, lng: moment.longitude }, moment.place_name)

  const subtitle = scheduled && moment.other
    ? `Avec ${moment.other.first_name}`
    : isCreator ? 'Ta proposition' : `Proposé par ${moment.creator_first_name}`

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      <ScreenHeader title={moment.title} subtitle={subtitle} onBack={back} />

      {/* Statut d'un moment calé */}
      {scheduled && <StatusBanner moment={moment} />}

      {/* L'autre personne, révélée après double acceptation */}
      {scheduled && moment.other && <OtherPerson other={moment.other} placeName={moment.place_name} />}

      {/* Après : retour, revoir mutuel */}
      {moment.feedback_open && !moment.my_feedback_given && (
        <Button fullWidth size="lg" onClick={() => router.push(ROUTES.RENCONTRES_FEEDBACK(moment.id))}>
          Comment ça s’est passé ?
        </Button>
      )}
      {moment.meet_again_mutual && moment.other && (
        <section className="rounded-card bg-accent-light p-4 space-y-3">
          <p className="font-bold text-accent-dark flex items-center gap-1.5">
            <Heart className="w-4 h-4" /> Vous pouvez vous revoir
          </p>
          <Button
            fullWidth
            variant="secondary"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={() => router.push(ROUTES.RENCONTRES_JOUR_J(moment.id))}
          >
            Écrire à {moment.other.first_name}
          </Button>
        </section>
      )}
      {moment.my_feedback_given && !moment.my_feedback_reported && !moment.shared_memory_created_at && !moment.my_wants_memory && (
        <Button fullWidth variant="outline" onClick={() => router.push(ROUTES.RENCONTRES_FEEDBACK(moment.id))}>
          Ajouter en souvenir commun ?
        </Button>
      )}

      {/* Jour J : check-in, indice, chat, sécurité */}
      {scheduled && (isActive || moment.status === 'done') && (
        <Button
          fullWidth
          size="lg"
          variant={moment.day_window_open ? 'primary' : 'outline'}
          leftIcon={<Sun className="w-4 h-4" />}
          onClick={() => router.push(ROUTES.RENCONTRES_JOUR_J(moment.id))}
        >
          {moment.day_window_open ? 'Jour J : je suis en route' : 'Jour J : check-in, indice, chat'}
        </Button>
      )}
      {isActive && (
        <section className="space-y-2">
          <p className="text-sm text-ink-soft">Dis à quelqu’un de confiance où et avec qui tu seras :</p>
          <ShareWithContactButton moment={moment} />
        </section>
      )}

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
        {isActive && (
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-full border border-line text-sm font-bold text-ink hover:bg-surface-2"
          >
            <Navigation className="w-4 h-4 text-accent" /> Itinéraire
          </a>
        )}
      </section>

      {/* Pourquoi ce lieu (avant double acceptation) */}
      {!isCreator && !scheduled && (moment.creator_why || moment.common_places.length > 0) && (
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

      {/* Créneaux (tant que rien n'est calé) */}
      {!scheduled && (
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
      )}

      {/* Créateur : demandes à valider */}
      {isCreator && isOpen && (
        <section className="space-y-3">
          <h2 className="text-lg text-ink">
            {moment.requests?.length ? 'Qui est partant·e ?' : 'En attente de réponses'}
          </h2>
          {moment.requests?.map(r => (
            <RequestCard
              key={r.token}
              request={r}
              placeKey={moment.place_key}
              busy={busy}
              onReported={load}
              momentId={moment.id}
              onAccept={() => run(() => momentsService.acceptRequest(moment.id, r.token), `C’est calé avec ${r.first_name} !`)}
            />
          ))}
          <p className="text-sm text-muted">
            Visible jusqu’au {formatSlot(moment.expires_at)} par les personnes de même intention qui aiment ce lieu.
            {moment.requests?.length ? ' Les autres demandes disparaîtront simplement, sans notification.' : ' Sans réponse, il expire simplement.'}
          </p>
        </section>
      )}
      {isCreator && moment.status === 'expired' && (
        <p className="text-sm text-muted text-center">Ce moment a expiré. Tu peux en proposer un nouveau quand tu veux.</p>
      )}
      {isCreator && !scheduled && moment.status === 'cancelled' && (
        <p className="text-sm text-muted text-center">Tu as annulé ce moment.</p>
      )}

      {/* Invité : demande */}
      {!isCreator && isOpen && (
        <div className="space-y-2">
          <Button
            fullWidth
            size="xl"
            loading={busy}
            disabled={!slot || sameInstant(slot, moment.my_chosen_slot)}
            onClick={() => slot && run(() => momentsService.requestSlot(id, slot), 'C’est envoyé ! Tu seras prévenu·e si le moment est calé.')}
          >
            {requested ? 'Changer de créneau' : 'Je suis partant·e'}
          </Button>
          {requested && (
            <>
              <p className="text-sm text-muted text-center">
                {moment.creator_first_name} doit valider. Sans réponse, le moment expirera simplement le {formatSlot(moment.expires_at)}.
              </p>
              <Button fullWidth variant="ghost" disabled={busy} onClick={() => run(() => momentsService.withdrawRequest(id), 'Ta demande est retirée.')}>
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

      {/* Moment calé : confirmation */}
      {moment.status === 'matched' && !moment.my_confirmed_at && (
        <Button
          fullWidth
          size="xl"
          loading={busy}
          leftIcon={<CheckCircle2 className="w-5 h-5" />}
          onClick={() => run(() => momentsService.confirm(id), 'Merci ! Ta présence est confirmée.')}
        >
          Toujours partant·e : je confirme
        </Button>
      )}

      {/* Annulation */}
      {(isActive || (isCreator && isOpen)) && (
        <Button fullWidth variant="ghost" disabled={busy} onClick={() => setCancelOpen(true)}>
          Annuler ce moment
        </Button>
      )}

      {/* Signalement, accessible partout */}
      <div className="flex justify-center pt-2">
        {scheduled && moment.other ? (
          <ReportButton momentId={moment.id} personName={moment.other.first_name} onReported={load} />
        ) : !isCreator ? (
          <ReportButton momentId={moment.id} personName={moment.creator_first_name} onReported={back} />
        ) : null}
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Annuler ce moment ?">
        <p className="text-sm text-ink-soft mb-5">
          {isActive
            ? lateCancel
              ? `C’est dans moins de 12 h : ${moment.other?.first_name ?? 'l’autre personne'} sera prévenu·e et ta fiabilité baissera de 10 points.`
              : `${moment.other?.first_name ?? 'L’autre personne'} sera prévenu·e. Plus de 12 h avant : aucune conséquence sur ta fiabilité.`
            : 'Le moment disparaîtra du fil. Les personnes intéressées ne seront pas notifiées.'}
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="danger" fullWidth loading={busy} onClick={handleCancel}>
            Oui, annuler
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setCancelOpen(false)}>
            Garder le moment
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function StatusBanner({ moment }: { moment: MomentDetail }) {
  const when = formatSlot(moment.scheduled_at!)
  const other = moment.other?.first_name ?? 'L’autre personne'
  const content = (() => {
    switch (moment.status) {
      case 'matched':
        return {
          title: `C’est calé : ${when}`,
          text: moment.my_confirmed_at
            ? moment.other?.confirmed ? 'Vous avez confirmé tous les deux.' : `Tu as confirmé. En attente de la confirmation de ${other}.`
            : 'La veille à 18 h, on vous demandera « Toujours partant·e ? ». Tu peux déjà confirmer.',
        }
      case 'confirmed':
        return { title: `Confirmé : ${when}`, text: 'Vous êtes tous les deux partants. Rappel 2 h avant, avec l’itinéraire.' }
      case 'done':
        return { title: `Rencontre du ${when}`, text: 'C’est passé. On espère que c’était un bon moment.' }
      case 'cancelled':
        return { title: 'Moment annulé', text: moment.cancelled_by_me ? 'Tu as annulé ce moment.' : 'Ce moment n’aura pas lieu.' }
      default:
        return { title: when, text: 'Ce moment n’a pas été confirmé des deux côtés.' }
    }
  })()
  const tone = moment.status === 'cancelled' || moment.status === 'expired' ? 'bg-neutral-100 text-ink-soft' : 'bg-accent-light text-accent-dark'
  return (
    <div className={cn('rounded-card p-4', tone)}>
      <p className="font-bold">{content.title}</p>
      <p className="text-sm mt-0.5">{content.text}</p>
    </div>
  )
}

function OtherPerson({ other, placeName }: { other: MomentOther; placeName: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (other.photo_path) {
      rencontresService.getPhotoUrl(other.photo_path).then(u => { if (!cancelled) setPhotoUrl(u) })
    }
    return () => { cancelled = true }
  }, [other.photo_path])

  return (
    <section className="bg-paper rounded-card shadow-card p-4 flex gap-4">
      <div className="w-24 h-24 flex-shrink-0 rounded-card overflow-hidden bg-placeholder flex items-center justify-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={`Photo de ${other.first_name}`} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-3xl text-accent">{other.first_name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="font-display text-xl text-ink">{other.first_name}</p>
        <p className="text-xs text-muted flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> Fiabilité {other.reliability_score}
        </p>
        {other.why && (
          <p className="text-sm text-ink-soft">Aime {placeName} pour « {other.why} »</p>
        )}
      </div>
    </section>
  )
}

function RequestCard({
  request,
  placeKey,
  momentId,
  busy,
  onAccept,
  onReported,
}: {
  request: MomentRequest
  /** Lieu du moment : son « pourquoi » est déjà affiché */
  placeKey: string
  momentId: string
  busy: boolean
  onReported: () => void
  onAccept: () => void
}) {
  return (
    <div className="bg-paper rounded-card shadow-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent-light text-accent font-display text-lg flex items-center justify-center" aria-hidden>
          {request.first_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink">{request.first_name}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" /> Fiabilité {request.reliability_score}
          </p>
        </div>
      </div>
      <p className="text-sm font-bold text-ink flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-accent" /> {formatSlot(request.chosen_slot)}
      </p>
      {request.why && <p className="text-sm text-ink-soft">Aime ce lieu pour « {request.why} »</p>}
      <CommonPlacesList places={request.common_places} theirName={request.first_name} exclude={placeKey} />
      <Button fullWidth loading={busy} onClick={onAccept}>
        Valider avec {request.first_name}
      </Button>
      <div className="flex justify-center">
        <ReportButton momentId={momentId} personName={request.first_name} requestToken={request.token} onReported={onReported} />
      </div>
    </div>
  )
}
