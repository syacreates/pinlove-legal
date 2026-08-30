'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useAppStore } from '@/stores/app.store'
import { placesService } from '@/services/places.service'
import { mapService } from '@/services/map.service'
import type { PlaceCategory, PlaceVisibility } from '@/lib/types'
import { PLACE_CATEGORIES, ROUTES, VISIBILITY_OPTIONS } from '@/lib/constants'

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

export default function EditPlacePage() {
  const { id }      = useParams<{ id: string }>()
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const loadPlaces  = usePlacesStore(s => s.loadPlaces)
  const addToast    = useAppStore(s => s.addToast)

  const [form,    setForm]    = useState<FormData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    placesService.getPlace(id).then(place => {
      if (!place) { router.replace(ROUTES.PLACES); return }
      setForm({
        name:        place.name,
        address:     place.address,
        postal_code: place.postal_code ?? '',
        city:        place.city,
        category:    place.category,
        description: place.description ?? '',
        note:        place.note ?? '',
        visibility:  place.visibility,
      })
    })
  }, [id, router])

  function updateForm(field: keyof FormData, value: string) {
    setForm(f => f ? { ...f, [field]: value } : f)
  }

  async function handleSave() {
    if (!form) return
    setError(null)

    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      const msg = 'Nom, adresse et ville sont requis.'
      setError(msg)
      addToast({ type: 'error', message: msg })
      return
    }

    setLoading(true)
    try {
      const coords = await mapService.geocodeAddress(`${form.address}, ${form.city}`)
      const { error: err } = await placesService.updatePlace(id, user.id, {
        ...form,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      })

      if (err) {
        setError(err)
        addToast({ type: 'error', message: err })
      } else {
        await loadPlaces(user.id)
        addToast({ type: 'success', message: `${form.name} mis à jour !` })
        router.replace(ROUTES.PLACE(id))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inattendue.'
      setError(msg)
      addToast({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  if (!form) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Modifier le lieu</h1>
          <p className="text-sm text-neutral-500">{form.name}</p>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-4">
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
          <label className="text-sm font-medium text-neutral-700">Catégorie *</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PLACE_CATEGORIES).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateForm('category', key)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-sm transition-all ${
                  form.category === key
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-brass-dim/30 bg-paper text-ink/70 hover:border-brass-dim/60'
                }`}
              >
                <span className="text-xl">{val.emoji}</span>
                <span className="text-xs font-medium leading-tight text-center">{val.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        <Input
          label="Adresse *"
          value={form.address}
          onChange={e => updateForm('address', e.target.value)}
          placeholder="Ex : 172 Bd Saint-Germain"
          required
        />

        {/* Postal code + City */}
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
          placeholder="Ton astuce personnelle"
        />

        {/* Visibility */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Visibilité</label>
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
                    : 'border-brass-dim/30 bg-paper text-ink hover:border-brass-dim/60'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
                  <p className="text-xs text-neutral-500">{opt.description}</p>
                </div>
                {opt.value !== 'private' && user.plan === 'free' && (
                  <span className="text-xs text-brand-500 font-semibold">Premium</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && <p className="text-sm text-red-500 text-center mt-4 mb-2 px-2">{error}</p>}

      {/* Sticky save button */}
      <div className="fixed bottom-[72px] left-0 right-0 z-50 flex justify-center px-4 pb-3 pt-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <Button
          type="button"
          onClick={handleSave}
          loading={loading}
          size="lg"
          className="pointer-events-auto shadow-lg"
        >
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  )
}
