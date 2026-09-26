'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, MapPin, Navigation, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { PaymentRule } from '@/components/rencontres/MomentCards'
import { AlertButton, AlertSheet, ReportButton, ShareWithContactButton } from '@/components/rencontres/Safety'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { momentsService } from '@/services/moments.service'
import { chatService } from '@/services/chat.service'
import { mapService } from '@/services/map.service'
import { getCurrentPosition } from '@/lib/geo'
import { CHECK_IN_RADIUS_M, HINT_MAX, ROUTES } from '@/lib/constants'
import { cn, formatSlot } from '@/lib/utils'
import type { MomentDetail, MomentMessage } from '@/lib/types'

const time = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export default function JourJPage() {
  const { id }      = useParams<{ id: string }>()
  const router      = useRouter()
  const addToast    = useAppStore(s => s.addToast)
  const user        = useAuthStore(s => s.user)!
  const loadProfile = useRencontreStore(s => s.loadProfile)

  const [moment,    setMoment]    = useState<MomentDetail | null | undefined>(undefined)
  const [hint,      setHint]      = useState('')
  const [checking,  setChecking]  = useState(false)
  const [savingHint, setSavingHint] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [allGood,   setAllGood]   = useState(false)

  const load = useCallback(async () => {
    const m = await momentsService.getMoment(id)
    setMoment(m)
    return m
  }, [id])

  useEffect(() => {
    loadProfile(user.id)
    load().then(m => setHint(m?.my_hint ?? ''))
    // Arrivée et indice de l'autre : rafraîchis toutes les 20 s.
    const timer = setInterval(load, 20_000)
    return () => clearInterval(timer)
  }, [load, loadProfile, user.id])

  useEffect(() => {
    try { setAllGood(localStorage.getItem(`pinlove-all-good-${id}`) === '1') } catch { /* stockage indisponible */ }
  }, [id])

  if (moment === undefined) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!moment || !moment.scheduled_at || !moment.my_role) {
    return (
      <div className="screen-scroll px-4 pt-6">
        <ScreenHeader title="Jour J" onBack={() => router.push(ROUTES.RENCONTRES)} />
        <p className="text-center text-muted">Ce moment n’est plus disponible.</p>
      </div>
    )
  }

  const other     = moment.other
  const otherName = other?.first_name ?? 'L’autre personne'
  const start     = new Date(moment.scheduled_at).getTime()
  const end       = start + moment.duration_min * 60_000
  const now       = Date.now()
  const showCheck = now >= end + 30 * 60_000 && now < end + 6 * 3600_000 && !allGood
  const cancelled = moment.status === 'cancelled' || moment.status === 'expired'

  async function handleCheckIn() {
    setChecking(true)
    try {
      const pos = await getCurrentPosition()
      const { distance, error } = await momentsService.checkIn(id, pos.lat, pos.lng)
      if (error) addToast({ type: 'error', message: error })
      else addToast({ type: 'success', message: `C’est noté, tu es à ${distance} m. ${otherName} le voit.` })
      await load()
    } catch (e) {
      addToast({ type: 'error', message: e instanceof Error ? e.message : 'Position indisponible.' })
    } finally {
      setChecking(false)
    }
  }

  async function handleHint() {
    setSavingHint(true)
    const { error } = await momentsService.setHint(id, hint)
    setSavingHint(false)
    if (error) addToast({ type: 'error', message: error })
    else { addToast({ type: 'success', message: `${otherName} voit ton indice.` }); load() }
  }

  function markAllGood() {
    setAllGood(true)
    try { localStorage.setItem(`pinlove-all-good-${id}`, '1') } catch { /* stockage indisponible */ }
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-5">
      <ScreenHeader
        title="Jour J"
        subtitle={`${moment.title} · avec ${otherName}`}
        onBack={() => router.push(ROUTES.RENCONTRES_MOMENT(id))}
      />

      {cancelled && (
        <div className="rounded-card bg-neutral-100 p-4 text-sm text-ink-soft">Ce moment n’aura pas lieu.</div>
      )}

      {/* Tout va bien ? */}
      {showCheck && (
        <section className="rounded-card bg-accent-light p-4 space-y-3">
          <p className="font-display text-xl text-accent-dark">Tout va bien ?</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={markAllGood} leftIcon={<Check className="w-4 h-4" />}>Oui, tout va bien</Button>
            <Button className="flex-1" variant="outline" onClick={() => setAlertOpen(true)}>J’ai besoin d’aide</Button>
          </div>
        </section>
      )}

      {/* Rendez-vous */}
      <section className="bg-paper rounded-card shadow-card p-4 space-y-3">
        <div>
          <p className="font-bold text-ink flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-accent" /> {moment.place_name}
          </p>
          <p className="text-sm text-muted">{formatSlot(moment.scheduled_at)}{moment.place_address ? ` · ${moment.place_address}` : ''}</p>
        </div>
        <div className="flex items-center justify-between">
          <a
            href={mapService.buildDirectionsUrl({ lat: moment.latitude, lng: moment.longitude }, moment.place_name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent"
          >
            <Navigation className="w-4 h-4" /> Itinéraire
          </a>
          <PaymentRule rule={moment.payment_rule} className="text-sm" />
        </div>
      </section>

      {/* Arrivées */}
      <section className="grid grid-cols-2 gap-3">
        <ArrivalTile label="Toi" arrived={!!moment.my_checked_in_at} />
        <ArrivalTile label={otherName} arrived={!!other?.checked_in} />
      </section>

      {!moment.my_checked_in_at && !cancelled && (
        <div>
          <Button fullWidth size="xl" loading={checking} disabled={!moment.day_window_open} onClick={handleCheckIn}>
            Je suis arrivé·e
          </Button>
          <p className="text-xs text-muted text-center mt-2">
            {moment.day_window_open
              ? `Ta position sert uniquement à ce check-in : il faut être à moins de ${CHECK_IN_RADIUS_M} m du lieu.`
              : `Disponible à partir de ${time(new Date(start - 2 * 3600_000).toISOString())}, 2 h avant le rendez-vous.`}
          </p>
        </div>
      )}

      {/* Indices */}
      <section className="space-y-2">
        <h2 className="text-lg text-ink">Pour se retrouver</h2>
        {other?.hint && (
          <p className="rounded-2xl bg-accent-light px-3 py-2.5 text-sm text-accent-dark">
            <span className="font-bold">{otherName} :</span> « {other.hint} »
          </p>
        )}
        <div className="flex gap-2">
          <input
            aria-label="Ton indice"
            value={hint}
            onChange={e => setHint(e.target.value.slice(0, HINT_MAX))}
            disabled={!moment.day_window_open}
            placeholder="Ex : veste verte, près de l’entrée"
            className="flex-1 h-11 rounded-xl bg-surface border border-line px-3 text-[15px] focus:outline-none focus:border-accent disabled:opacity-50"
          />
          <Button
            variant="secondary"
            loading={savingHint}
            disabled={!moment.day_window_open || hint.trim() === (moment.my_hint ?? '')}
            onClick={handleHint}
          >
            OK
          </Button>
        </div>
      </section>

      {/* Chat */}
      <Chat moment={moment} userId={user.id} otherName={otherName} />

      {/* Sécurité */}
      <section className="space-y-3 rounded-card border border-dashed border-dash p-4">
        <h2 className="text-lg text-ink">Sécurité</h2>
        <ShareWithContactButton moment={moment} />
        <div className="flex items-center justify-between">
          <AlertButton moment={moment} />
          <ReportButton momentId={moment.id} personName={otherName} onReported={load} />
        </div>
      </section>

      <AlertSheet moment={moment} open={alertOpen} onClose={() => setAlertOpen(false)} />
    </div>
  )
}

function ArrivalTile({ label, arrived }: { label: string; arrived: boolean }) {
  return (
    <div className={cn('rounded-card p-3 text-center', arrived ? 'bg-accent-light' : 'bg-paper shadow-card')}>
      <p className="text-sm font-bold text-ink truncate">{label}</p>
      <p className={cn('text-xs mt-0.5', arrived ? 'text-accent-dark font-bold' : 'text-muted')}>
        {arrived ? 'Arrivé·e ✓' : 'Pas encore arrivé·e'}
      </p>
    </div>
  )
}

// ── Chat limité ──────────────────────────────────────────────────────────────

function Chat({ moment, userId, otherName }: { moment: MomentDetail; userId: string; otherName: string }) {
  const addToast = useAppStore(s => s.addToast)
  const [messages, setMessages] = useState<MomentMessage[]>([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatService.list(moment.id).then(setMessages)
    return chatService.subscribe(moment.id, m =>
      setMessages(list => (list.some(x => x.id === m.id) ? list : [...list, m])))
  }, [moment.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length])

  async function send() {
    if (!text.trim()) return
    setSending(true)
    const { message, error } = await chatService.send(moment.id, userId, text)
    setSending(false)
    if (error || !message) { addToast({ type: 'error', message: error ?? 'Message non envoyé.' }); return }
    setMessages(list => (list.some(x => x.id === message.id) ? list : [...list, message]))
    setText('')
  }

  const start = new Date(moment.scheduled_at!).getTime()

  return (
    <section className="space-y-2">
      <h2 className="text-lg text-ink">Chat</h2>
      <div className="bg-paper rounded-card shadow-card p-3 space-y-2 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted text-center py-4">
            {moment.chat_open ? `Juste pour se retrouver avec ${otherName}.` : 'Aucun message.'}
          </p>
        )}
        {messages.map(m => {
          const mine = m.sender_id === userId
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-accent text-white' : 'bg-neutral-100 text-ink')}>
                <p>{m.body}</p>
                <p className={cn('text-[10px] mt-0.5', mine ? 'text-white/70' : 'text-muted')}>{time(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {moment.chat_open ? (
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send() }}>
          <input
            aria-label="Message"
            value={text}
            onChange={e => setText(e.target.value.slice(0, 1000))}
            placeholder="Je suis à la terrasse…"
            className="flex-1 h-11 rounded-full bg-surface border border-line px-4 text-[15px] focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Envoyer"
            className="w-11 h-11 flex-shrink-0 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-50"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted text-center">
          {Date.now() < start
            ? `Le chat s’ouvre à ${time(new Date(start - 2 * 3600_000).toISOString())}, 2 h avant le rendez-vous.`
            : 'Le chat est fermé : il ne reste ouvert que 3 h après le début du rendez-vous.'}
        </p>
      )}
    </section>
  )
}
