'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { PaymentRule } from '@/components/rencontres/MomentCards'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { usePlacesStore } from '@/stores/places.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { momentsService } from '@/services/moments.service'
import { MOMENT_DURATIONS, MOMENT_TITLE_MAX, PLACE_CATEGORIES, ROUTES } from '@/lib/constants'
import { cn, formatDuration } from '@/lib/utils'

/** Valeur pour <input type="datetime-local"> (heure locale). */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NewMomentPage() {
  return (
    <Suspense>
      <NewMomentForm />
    </Suspense>
  )
}

function NewMomentForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const user         = useAuthStore(s => s.user)!
  const addToast     = useAppStore(s => s.addToast)
  const places       = usePlacesStore(s => s.places)
  const profile      = useRencontreStore(s => s.profile)
  const loaded       = useRencontreStore(s => s.loaded)
  const loadProfile  = useRencontreStore(s => s.loadProfile)

  const openPlaces = useMemo(() => places.filter(p => p.rencontre_open), [places])

  const [placeId,  setPlaceId]  = useState<string | null>(searchParams.get('place'))
  const [title,    setTitle]    = useState('')
  const [duration, setDuration] = useState<number>(60)
  const [slots,    setSlots]    = useState<string[]>(['', ''])
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])
  useEffect(() => {
    if (loaded && !(profile?.enabled && profile.principles_accepted_at)) router.replace(ROUTES.RENCONTRES)
  }, [loaded, profile, router])

  // Lieu par défaut : celui passé en paramètre s'il est ouvert, sinon le seul lieu ouvert.
  useEffect(() => {
    if (placeId && openPlaces.some(p => p.id === placeId)) return
    setPlaceId(openPlaces.length === 1 ? openPlaces[0].id : null)
  }, [openPlaces, placeId])

  const minSlot = toLocalInput(new Date(Date.now() + 3 * 3600_000))
  const maxSlot = toLocalInput(new Date(Date.now() + 30 * 24 * 3600_000))

  function setSlot(i: number, value: string) {
    setSlots(s => s.map((v, j) => (j === i ? value : v)))
  }

  async function handleSubmit() {
    if (!placeId) { addToast({ type: 'error', message: 'Choisis un lieu.' }); return }
    if (!title.trim()) { addToast({ type: 'error', message: 'Donne un titre à ton moment.' }); return }
    const dates = slots.filter(Boolean).map(v => new Date(v))
    if (dates.length < 2) { addToast({ type: 'error', message: 'Propose au moins 2 créneaux.' }); return }
    if (new Set(dates.map(d => d.getTime())).size !== dates.length) {
      addToast({ type: 'error', message: 'Les créneaux doivent être différents.' })
      return
    }

    setSaving(true)
    const { id, error } = await momentsService.createMoment({ placeId, title: title.trim(), slots: dates, durationMin: duration })
    setSaving(false)
    if (error || !id) {
      addToast({ type: 'error', message: error ?? 'Création impossible.' })
      return
    }
    addToast({ type: 'success', message: 'Moment proposé ! Il est visible 48 h par les personnes qui aiment ce lieu.' })
    router.replace(ROUTES.RENCONTRES_MOMENT(id))
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-6">
      <ScreenHeader title="Proposer un moment" subtitle="Une sortie dans un de tes lieux ouverts" />

      {/* Lieu */}
      <section>
        <h2 className="text-sm font-bold text-neutral-900 mb-2">Où ?</h2>
        {openPlaces.length === 0 ? (
          <p className="text-sm text-muted">
            Aucun lieu ouvert.{' '}
            <button type="button" className="font-bold text-accent" onClick={() => router.push(ROUTES.RENCONTRES_LIEUX)}>
              Ouvrir un lieu
            </button>
          </p>
        ) : (
          <div className="space-y-2" role="radiogroup" aria-label="Lieu">
            {openPlaces.map(p => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={placeId === p.id}
                onClick={() => setPlaceId(p.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all',
                  placeId === p.id ? 'border-accent bg-accent-light' : 'border-line bg-paper hover:border-dash',
                )}
              >
                <span className="text-xl" aria-hidden>{PLACE_CATEGORIES[p.category].emoji}</span>
                <div className="min-w-0">
                  <p className="font-bold text-ink truncate">{p.name}</p>
                  <p className="text-xs text-muted truncate">{p.address}, {p.city}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Titre */}
      <Input
        id="moment-title"
        label="Quoi ?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={MOMENT_TITLE_MAX}
        placeholder="Ex : Café + lecture"
        hint="Le moment avant la personne : dis ce que vous ferez."
      />

      {/* Durée */}
      <section>
        <h2 className="text-sm font-bold text-neutral-900 mb-2">Combien de temps ?</h2>
        <div className="flex gap-2">
          {MOMENT_DURATIONS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              aria-pressed={duration === d}
              className={cn(
                'flex-1 h-11 rounded-full border text-sm font-bold transition-all',
                duration === d ? 'border-accent bg-accent-light text-accent-dark' : 'border-line bg-paper text-ink-soft',
              )}
            >
              {formatDuration(d)}
            </button>
          ))}
        </div>
      </section>

      {/* Créneaux */}
      <section>
        <h2 className="text-sm font-bold text-neutral-900">Quand ?</h2>
        <p className="text-xs text-muted mb-2">2 ou 3 créneaux : la personne en choisira un.</p>
        <div className="space-y-2">
          {slots.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="datetime-local"
                aria-label={`Créneau ${i + 1}`}
                value={value}
                min={minSlot}
                max={maxSlot}
                onChange={e => setSlot(i, e.target.value)}
                className="flex-1 h-12 rounded-xl bg-surface border border-line px-3 text-[15px] font-medium text-neutral-900 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              {i === 2 && (
                <button
                  type="button"
                  aria-label="Retirer ce créneau"
                  onClick={() => setSlots(s => s.slice(0, 2))}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:bg-ink/5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {slots.length < 3 && (
          <button
            type="button"
            onClick={() => setSlots(s => [...s, ''])}
            className="mt-2 text-sm font-bold text-accent flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Ajouter un 3e créneau
          </button>
        )}
      </section>

      <div className="rounded-card bg-paper shadow-card p-4 space-y-1">
        <PaymentRule rule="Chacun sa part" className="text-sm text-ink-soft" />
        <p className="text-xs text-muted">
          Visible 48 h par les personnes de même intention qui ont ce lieu ouvert. Sans réponse, il
          expire simplement.
        </p>
      </div>

      <Button fullWidth size="xl" loading={saving} onClick={handleSubmit} disabled={openPlaces.length === 0}>
        Proposer ce moment
      </Button>
    </div>
  )
}
