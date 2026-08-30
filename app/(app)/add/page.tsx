'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { AddressAutocomplete, type AddressResult } from '@/components/ui/AddressAutocomplete'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useAppStore } from '@/stores/app.store'
import { mapService } from '@/services/map.service'
import type { PlaceCategory, PlaceVisibility } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES, FREE_PLAN_LIMIT, VISIBILITY_OPTIONS } from '@/lib/constants'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import Link from 'next/link'

type FormData = {
  name: string
  address: string
  postal_code: string
  city: string
  category: PlaceCategory
  description: string
  note: string
  visibility: PlaceVisibility
}

export default function AddPlacePage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const createPlace = usePlacesStore(s => s.createPlace)
  const count     = usePlacesStore(s => s.placesCount)
  const addToast  = useAppStore(s => s.addToast)
  const openPaywall = useAppStore(s => s.openPaywall)

  const [form, setForm] = useState<FormData>({
    name: '', address: '', postal_code: '', city: '', category: 'restaurant',
    description: '', note: '', visibility: 'private',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [autoCoords, setAutoCoords] = useState<{ lat: number; lng: number } | null>(null)

  const isAtLimit = user.plan === 'free' && count >= FREE_PLAN_LIMIT

  function updateForm(field: keyof FormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function savePlace() {
    setError(null)

    if (isAtLimit) {
      openPaywall()
      return
    }

    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      const msg = 'Nom, adresse et ville sont requis.'
      setError(msg)
      addToast({ type: 'error', message: msg })
      return
    }

    setLoading(true)

    try {
      const coords = autoCoords ?? await mapService.geocodeAddress(`${form.address}, ${form.city}`)

      const { error: err } = await createPlace(
        user.id,
        {
          ...form,
          latitude:  coords?.lat ?? 48.8566,
          longitude: coords?.lng ?? 2.3522,
        },
        user.plan,
      )

      if (err) {
        setError(err)
        addToast({ type: 'error', message: err })
      } else {
        addToast({ type: 'success', message: `${form.name} ajouté avec succès !` })
        router.push(ROUTES.PLACES)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inattendue.'
      setError(msg)
      addToast({ type: 'error', message: msg })
      console.error('[savePlace] exception', e)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    savePlace()
  }

  if (isAtLimit) {
    return (
      <div className="screen-scroll flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">🚫</span>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Limite gratuite atteinte</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Tu as atteint la limite de {FREE_PLAN_LIMIT} adresses du plan gratuit. Passe en premium pour continuer.
        </p>
        <Button variant="primary" size="lg" onClick={() => router.push(ROUTES.PRICING)} fullWidth className="max-w-xs">
          Voir l'offre Premium
        </Button>
        <button onClick={() => router.back()} className="mt-4 text-sm text-neutral-500">
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="screen-scroll px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-paper rounded-2xl shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-ink/70" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-paper">Ajouter un lieu</h1>
          <p className="text-sm text-mist">Saisie manuelle</p>
        </div>
      </div>

      {/* Import link shortcut */}
      <Link
        href={ROUTES.IMPORT}
        className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl p-3 mb-6"
      >
        <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Link2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-900">Tu as un lien TikTok ou Instagram ?</p>
          <p className="text-xs text-brand-600">Importe directement →</p>
        </div>
      </Link>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          label="Nom du lieu *"
          value={form.name}
          onChange={e => updateForm('name', e.target.value)}
          placeholder="Ex : Café de Flore"
          leftIcon={<MapPin className="w-4 h-4" />}
          required
        />

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wide text-mist-2">Catégorie *</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PLACE_CATEGORIES).map(([key, val]) => {
              const Icon = CATEGORY_ICONS[key as PlaceCategory]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateForm('category', key)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-sm transition-all ${
                    form.category === key
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-dashed border-brass-dim/40 bg-paper text-ink/70 hover:border-brass-dim/70'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium leading-tight text-center">{val.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Address */}
        <AddressAutocomplete
          label="Adresse *"
          value={form.address}
          onChange={v => updateForm('address', v)}
          onSelect={(r: AddressResult) => {
            updateForm('address', r.address)
            updateForm('city', r.city)
            updateForm('postal_code', r.postal_code)
            setAutoCoords({ lat: r.lat, lng: r.lng })
          }}
        />

        {/* Postal code + City row */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Code postal"
            value={form.postal_code}
            onChange={e => updateForm('postal_code', e.target.value)}
            placeholder="Ex : 75006"
          />
          <Input
            label="Ville *"
            value={form.city}
            onChange={e => updateForm('city', e.target.value)}
            placeholder="Ex : Paris"
            required
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          value={form.description}
          onChange={e => updateForm('description', e.target.value)}
          placeholder="Quelques mots sur ce lieu..."
        />

        {/* Note */}
        <Textarea
          label="Ma note privée"
          value={form.note}
          onChange={e => updateForm('note', e.target.value)}
          placeholder="Ton astuce personnelle (commander le chocolat chaud !)"
        />

        {/* Visibility */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wide text-mist-2">Visibilité</label>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.value !== 'private' && user.plan === 'free') {
                    addToast({ type: 'info', message: 'Le partage est disponible en premium.' })
                    return
                  }
                  updateForm('visibility', opt.value)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                  form.visibility === opt.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-dashed border-brass-dim/40 bg-paper text-ink hover:border-brass-dim/70'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  <p className="text-xs text-ink/60">{opt.description}</p>
                </div>
                {opt.value !== 'private' && user.plan === 'free' && (
                  <span className="text-xs text-brand-500 font-semibold">Premium</span>
                )}
              </button>
            ))}
          </div>
        </div>

      </form>

      {error && (
        <p className="text-sm text-red-500 text-center mt-4 mb-2 px-2">{error}</p>
      )}

      {/* Sticky save button */}
      <div className="fixed bottom-[72px] left-0 right-0 z-50 flex justify-center px-4 pb-3 pt-4 bg-gradient-to-t from-petrol-soft via-petrol-soft to-transparent pointer-events-none">
        <Button
          type="button"
          onClick={() => savePlace()}
          loading={loading}
          size="lg"
          className="pointer-events-auto shadow-lg"
        >
          Enregistrer ce lieu
        </Button>
      </div>
    </div>
  )
}
