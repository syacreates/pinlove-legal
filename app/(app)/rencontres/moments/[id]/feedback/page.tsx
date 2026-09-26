'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { momentsService } from '@/services/moments.service'
import { REPORT_REASONS, ROUTES } from '@/lib/constants'
import type { MomentDetail, ReportReason } from '@/lib/types'

type Step = 'again' | 'well' | 'report' | 'reason' | 'done'

export default function FeedbackPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const addToast = useAppStore(s => s.addToast)

  const [moment,   setMoment]   = useState<MomentDetail | null | undefined>(undefined)
  const [step,     setStep]     = useState<Step>('again')
  const [again,    setAgain]    = useState<boolean | null>(null)
  const [well,     setWell]     = useState<boolean | null>(null)
  const [sending,  setSending]  = useState(false)
  const [mutual,   setMutual]   = useState(false)

  const load = useCallback(async () => {
    const m = await momentsService.getMoment(id)
    setMoment(m)
    if (m?.my_feedback_given) { setStep('done'); setMutual(m.meet_again_mutual) }
    return m
  }, [id])

  useEffect(() => { load() }, [load])

  async function submit(reason: ReportReason | null) {
    if (well === null) return
    setSending(true)
    const res = await momentsService.submitFeedback(id, !!again && !reason, well, reason)
    setSending(false)
    if (res.error) { addToast({ type: 'error', message: res.error }); return }
    setMutual(res.mutual)
    setStep('done')
    await load()
  }

  if (moment === undefined) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!moment || !moment.feedback_open) {
    return (
      <div className="screen-scroll px-4 pt-6">
        <ScreenHeader title="Ton retour" onBack={() => router.push(ROUTES.RENCONTRES)} />
        <p className="text-center text-muted">Le retour s’ouvre après la rencontre.</p>
      </div>
    )
  }

  const name = moment.other?.first_name ?? 'l’autre personne'

  return (
    <div className="screen-scroll px-4 pt-6 space-y-6">
      <ScreenHeader title="Ton retour" subtitle={`${moment.title} · avec ${name}`} onBack={() => router.push(ROUTES.RENCONTRES_MOMENT(id))} />

      {step !== 'done' && (
        <p className="text-sm text-muted">
          3 gestes, et c’est tout. {name} ne verra jamais tes réponses.
        </p>
      )}

      {step === 'again' && (
        <Question title={`Tu aimerais revoir ${name} ?`}>
          <Choice label="Oui" onClick={() => { setAgain(true); setStep('well') }} />
          <Choice label="Non" onClick={() => { setAgain(false); setStep('well') }} />
        </Question>
      )}

      {step === 'well' && (
        <Question title="Ça s’est bien passé ?">
          <Choice label="Oui" onClick={() => { setWell(true); setStep('report') }} />
          <Choice label="Pas vraiment" onClick={() => { setWell(false); setStep('report') }} />
        </Question>
      )}

      {step === 'report' && (
        <Question title="Quelque chose à signaler ?">
          <Choice label="Non, tout va bien" disabled={sending} onClick={() => submit(null)} />
          <Choice label="Oui, signaler" disabled={sending} onClick={() => setStep('reason')} />
        </Question>
      )}

      {step === 'reason' && (
        <Question title={`Signaler ${name}`}>
          {(Object.keys(REPORT_REASONS) as ReportReason[]).map(key => (
            <Choice key={key} label={REPORT_REASONS[key]} disabled={sending} onClick={() => submit(key)} />
          ))}
          <p className="text-xs text-muted">
            {name} ne sera pas prévenu·e et vous ne vous croiserez plus sur PinLove.
          </p>
        </Question>
      )}

      {step === 'done' && (
        <DoneStep moment={moment} mutual={mutual} name={name} onChange={load} />
      )}
    </div>
  )
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

function Choice({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-2xl border-2 border-line bg-surface text-left px-4 font-bold text-neutral-900 hover:border-accent active:bg-accent/10 disabled:opacity-50"
    >
      {label}
    </button>
  )
}

// ── Après le retour : revoir mutuel, souvenir commun ─────────────────────────

function DoneStep({
  moment,
  mutual,
  name,
  onChange,
}: {
  moment: MomentDetail
  mutual: boolean
  name: string
  onChange: () => Promise<unknown>
}) {
  const router     = useRouter()
  const addToast   = useAppStore(s => s.addToast)
  const user       = useAuthStore(s => s.user)!
  const loadPlaces = usePlacesStore(s => s.loadPlaces)
  const [busy, setBusy] = useState(false)
  const [declined, setDeclined] = useState(false)

  async function memory(wants: boolean) {
    setBusy(true)
    const { created, error } = await momentsService.setSharedMemory(moment.id, wants)
    setBusy(false)
    if (error) { addToast({ type: 'error', message: error }); return }
    if (!wants) { setDeclined(true); return }
    if (created) {
      addToast({ type: 'success', message: 'Souvenir ajouté sur vos deux cartes !' })
      loadPlaces(user.id)
    }
    await onChange()
  }

  return (
    <div className="space-y-5">
      {mutual ? (
        <section className="rounded-card bg-accent/10 p-5 text-center space-y-3">
          <Heart className="w-8 h-8 text-accent mx-auto" />
          <p className="font-display text-2xl text-accent-ink">Vous pouvez vous revoir</p>
          <p className="text-sm text-accent-ink">{name} aimerait aussi vous revoir. Le chat est ouvert.</p>
          <Button onClick={() => router.push(ROUTES.RENCONTRES_JOUR_J(moment.id))}>Écrire à {name}</Button>
        </section>
      ) : (
        <section className="rounded-card bg-surface shadow-card p-5 text-center">
          <p className="font-display text-2xl text-neutral-900">Merci !</p>
          <p className="text-sm text-muted mt-1">Ton retour nous aide à faire de belles rencontres.</p>
        </section>
      )}

      {/* Souvenir commun (pas après un signalement) */}
      {moment.my_feedback_reported ? null : moment.shared_memory_created_at ? (
        <section className="rounded-card border border-line bg-surface p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-accent" />
          <p className="text-sm text-neutral-900">« {moment.title} » est un souvenir commun, daté sur vos deux cartes.</p>
        </section>
      ) : moment.my_wants_memory ? (
        <p className="text-sm text-muted text-center">
          Tu as proposé d’ajouter ce moment en souvenir commun. Il apparaîtra sur vos deux cartes si {name} accepte aussi.
        </p>
      ) : !declined && (
        <section className="rounded-card border border-dashed border-dash p-4 space-y-3">
          <p className="font-bold text-neutral-900">Ajouter en souvenir commun ?</p>
          <p className="text-sm text-muted">
            Si vous acceptez tous les deux, un pin daté « {moment.place_name} » apparaît sur vos deux cartes (privé).
            Sinon, rien n’est dit à personne.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" loading={busy} onClick={() => memory(true)}>Oui</Button>
            <Button className="flex-1" variant="outline" disabled={busy} onClick={() => memory(false)}>Non merci</Button>
          </div>
        </section>
      )}

      <Button fullWidth variant="ghost" onClick={() => router.push(ROUTES.RENCONTRES)}>Retour aux rencontres</Button>
    </div>
  )
}
