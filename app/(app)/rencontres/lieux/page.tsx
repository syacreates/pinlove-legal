'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScreenHeader, Switch, WhyTextField } from '@/components/rencontres/RencontreUI'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { usePlacesStore } from '@/stores/places.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { rencontresService } from '@/services/rencontres.service'
import { PLACE_CATEGORIES, ROUTES } from '@/lib/constants'
import type { Place } from '@/lib/types'

export default function RencontresLieuxPage() {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const places      = usePlacesStore(s => s.places)
  const loading     = usePlacesStore(s => s.loading)
  const profile     = useRencontreStore(s => s.profile)
  const loaded      = useRencontreStore(s => s.loaded)
  const loadProfile = useRencontreStore(s => s.loadProfile)

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])
  useEffect(() => {
    if (loaded && !profile?.principles_accepted_at) router.replace(ROUTES.RENCONTRES_ONBOARDING)
  }, [loaded, profile, router])

  const openCount = places.filter(p => p.rencontre_open).length

  return (
    <div className="screen-scroll px-4 pt-6">
      <ScreenHeader
        title="Mes lieux ouverts"
        subtitle={`${openCount} ouvert${openCount > 1 ? 's' : ''} sur ${places.length}`}
        onBack={() => router.push(ROUTES.RENCONTRES)}
      />

      <p className="text-sm text-ink-soft mb-4 px-1">
        Tes lieux sont privés par défaut. Un lieu ouvert sert uniquement à croiser des personnes qui
        l’aiment aussi. Personne ne voit ta liste : seulement les lieux que vous avez en commun, avec
        ton « pourquoi ».
      </p>

      {!loading && places.length === 0 ? (
        <EmptyState
          icon="📍"
          title="Aucun lieu pour l’instant"
          description="Ajoute tes lieux préférés sur ta carte, puis reviens en ouvrir certains."
          action={{ label: 'Ajouter un lieu', onClick: () => router.push(ROUTES.ADD) }}
        />
      ) : (
        <ul className="space-y-3">
          {places.map(place => (
            <PlaceOpenRow key={place.id} place={place} />
          ))}
        </ul>
      )}
    </div>
  )
}

function PlaceOpenRow({ place }: { place: Place }) {
  const addToast = useAppStore(s => s.addToast)
  const [why,    setWhy]    = useState(place.why_text ?? '')
  const [saving, setSaving] = useState(false)

  const dirty = why.trim() !== (place.why_text ?? '')

  async function save(open: boolean) {
    setSaving(true)
    const { place: updated, error } = await rencontresService.setPlaceRencontre(place, open, why)
    setSaving(false)
    if (error || !updated) {
      addToast({ type: 'error', message: error ?? 'Enregistrement impossible.' })
      return
    }
    usePlacesStore.setState(s => ({ places: s.places.map(p => (p.id === updated.id ? updated : p)) }))
    setWhy(updated.why_text ?? '')
    if (open !== place.rencontre_open) {
      addToast({ type: 'success', message: open ? `${place.name} est ouvert aux rencontres.` : `${place.name} est de nouveau privé.` })
    }
  }

  const meta = PLACE_CATEGORIES[place.category]

  return (
    <li className="bg-paper rounded-card shadow-card p-4">
      <div className="flex items-center gap-3">
        <span className="text-xl" aria-hidden>{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink truncate">{place.name}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            {place.rencontre_open
              ? <><Unlock className="w-3 h-3 text-accent" /> Ouvert · {place.city}</>
              : <><Lock className="w-3 h-3" /> Privé · {place.city}</>}
          </p>
        </div>
        <Switch
          checked={place.rencontre_open}
          onChange={save}
          disabled={saving}
          label={`Ouvrir ${place.name} aux rencontres`}
        />
      </div>

      {place.rencontre_open && (
        <div className="mt-4">
          <WhyTextField id={`why-${place.id}`} value={why} onChange={setWhy} />
          {dirty && (
            <Button size="sm" className="mt-2" loading={saving} onClick={() => save(true)}>
              Enregistrer
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
