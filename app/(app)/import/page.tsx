'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Link2, Check, AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { PlatformBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/auth.store'
import { usePlacesStore } from '@/stores/places.store'
import { useAppStore } from '@/stores/app.store'
import { socialImportService } from '@/services/social-import.service'
import { mapService } from '@/services/map.service'
import type { ImportResult, PlaceVisibility } from '@/lib/types'
import { detectPlatformFromUrl } from '@/lib/utils'
import { ROUTES, PLACE_CATEGORIES, FREE_PLAN_LIMIT } from '@/lib/constants'

type Step = 'input' | 'analyzing' | 'preview' | 'success' | 'error' | 'no_location'

export default function ImportPage() {
  const router    = useRouter()
  const user      = useAuthStore(s => s.user)!
  const createPlace = usePlacesStore(s => s.createPlace)
  const count     = usePlacesStore(s => s.placesCount)
  const addToast  = useAppStore(s => s.addToast)

  const [url,         setUrl]         = useState('')
  const [step,        setStep]        = useState<Step>('input')
  const [result,      setResult]      = useState<ImportResult | null>(null)
  const [saving,      setSaving]      = useState(false)

  // Editable preview fields
  const [name,        setName]        = useState('')
  const [address,     setAddress]     = useState('')
  const [city,        setCity]        = useState('')
  const [note,        setNote]        = useState('')
  const [visibility,  setVisibility]  = useState<PlaceVisibility>('private')

  const isAtLimit    = user.plan === 'free' && count >= FREE_PLAN_LIMIT
  const platform     = detectPlatformFromUrl(url)

  async function handleAnalyze() {
    if (!url.trim()) return

    setStep('analyzing')
    const res = await socialImportService.importFromUrl(url)
    setResult(res)

    if (res.status === 'found' && res.place_suggestion) {
      const s = res.place_suggestion
      setName(s.name ?? '')
      setAddress(s.address ?? '')
      setCity(s.city ?? '')
      setStep('preview')
    } else if (res.status === 'not_found') {
      setStep('no_location')
    } else {
      setStep('error')
    }
  }

  async function handleSave() {
    if (isAtLimit) {
      router.push(ROUTES.PRICING)
      return
    }

    if (!name.trim() || !address.trim() || !city.trim()) {
      addToast({ type: 'error', message: 'Nom, adresse et ville sont requis.' })
      return
    }

    setSaving(true)
    const coords = await mapService.geocodeAddress(`${address}, ${city}`)
    const suggestion = result?.place_suggestion

    const { error } = await createPlace(
      user.id,
      {
        name,
        address,
        city,
        country: suggestion?.country ?? 'France',
        category: suggestion?.category ?? 'other',
        description: suggestion?.description ?? '',
        note,
        photo_url: suggestion?.photo_url ?? null,
        latitude: coords?.lat ?? suggestion?.latitude ?? 48.8566,
        longitude: coords?.lng ?? suggestion?.longitude ?? 2.3522,
        visibility,
        source: result ? {
          platform: result.platform,
          url: result.raw_url,
          post_id: result.post_id,
          parsed_at: new Date().toISOString(),
          confidence: result.confidence,
        } : undefined,
      },
      user.plan,
    )

    setSaving(false)

    if (error) {
      addToast({ type: 'error', message: error })
    } else {
      addToast({ type: 'success', message: `📍 ${name} importé avec succès !` })
      setStep('success')
    }
  }

  function reset() {
    setUrl(''); setStep('input'); setResult(null)
    setName(''); setAddress(''); setCity(''); setNote('')
  }

  return (
    <div className="screen-scroll px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-2xl shadow-card flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Importer un lien</h1>
          <p className="text-sm text-neutral-500">TikTok ou Instagram</p>
        </div>
      </div>

      {/* ── Step: Input ── */}
      {step === 'input' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-neutral-50 rounded-3xl p-5 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h2 className="font-semibold text-neutral-900 mb-1">Colle ton lien ici</h2>
            <p className="text-sm text-neutral-500">
              Copie l'URL d'un post TikTok ou Instagram contenant un lieu, et on s'occupe du reste.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              label="Lien du post"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/..."
              leftIcon={<Link2 className="w-4 h-4" />}
              hint="Lien TikTok ou Instagram uniquement"
            />
            {url && platform && (
              <div className="flex items-center gap-2 pl-1">
                <PlatformBadge platform={platform} />
                <span className="text-xs text-neutral-500">Lien reconnu ✓</span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!url.trim() || !platform}
            onClick={handleAnalyze}
          >
            Analyser le lien
          </Button>

          {/* Help */}
          <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
            <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <strong>Comment ça marche ?</strong> On analyse le lien pour détecter le lieu mentionné dans le post. Si on n'y arrive pas, tu peux compléter manuellement.
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Analyzing ── */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="font-semibold text-neutral-900 mb-1">Analyse en cours...</h2>
          <p className="text-sm text-neutral-500">On extrait l'adresse depuis le post</p>
        </div>
      )}

      {/* ── Step: Preview (success) ── */}
      {step === 'preview' && result?.place_suggestion && (
        <div className="space-y-4 animate-fade-in">
          {/* Confidence indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl ${
            result.confidence >= 0.8 ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <Check className={`w-5 h-5 flex-shrink-0 ${result.confidence >= 0.8 ? 'text-green-500' : 'text-amber-500'}`} />
            <div>
              <p className="text-sm font-medium text-neutral-900">Lieu détecté !</p>
              <p className="text-xs text-neutral-500">
                Confiance : {Math.round(result.confidence * 100)}% — vérifie et ajuste si besoin
              </p>
            </div>
          </div>

          <Input label="Nom du lieu *" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Adresse *" value={address} onChange={e => setAddress(e.target.value)} />
          <Input label="Ville *" value={city} onChange={e => setCity(e.target.value)} />
          <Textarea label="Ma note" value={note} onChange={e => setNote(e.target.value)} placeholder="Ton impression personnelle..." />

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Visibilité</label>
            <div className="grid grid-cols-3 gap-2">
              {(['private', 'friends', 'public'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`py-2 rounded-2xl text-xs font-medium border-2 transition-all ${
                    visibility === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-neutral-100 bg-white text-neutral-600'
                  }`}
                >
                  {v === 'private' ? '🔒 Privé' : v === 'friends' ? '👥 Amis' : '🌍 Public'}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSave}>
            Enregistrer ce lieu
          </Button>
          <Button variant="ghost" fullWidth onClick={reset}>
            Recommencer
          </Button>
        </div>
      )}

      {/* ── Step: No location found ── */}
      {step === 'no_location' && (
        <div className="flex flex-col items-center text-center py-12 space-y-4 animate-fade-in">
          <div className="text-5xl">🔍</div>
          <h2 className="font-semibold text-neutral-900">Adresse non trouvée</h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            On n'a pas pu détecter de lieu dans ce post. Tu peux quand même enregistrer l'adresse manuellement.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.push(ROUTES.ADD)}>
            Saisir manuellement
          </Button>
          <Button variant="ghost" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* ── Step: Error ── */}
      {step === 'error' && (
        <div className="flex flex-col items-center text-center py-12 space-y-4 animate-fade-in">
          <div className="text-5xl">⚠️</div>
          <h2 className="font-semibold text-neutral-900">Lien non reconnu</h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            {result?.error_message ?? 'Ce lien n\'est pas pris en charge. Utilise un lien TikTok ou Instagram valide.'}
          </p>
          <Button variant="primary" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* ── Step: Success ── */}
      {step === 'success' && (
        <div className="flex flex-col items-center text-center py-16 space-y-5 animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">Lieu enregistré !</h2>
            <p className="text-sm text-neutral-500">
              <strong>{name}</strong> a été ajouté à tes lieux.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => router.push(ROUTES.PLACES)}>
            Voir mes lieux
          </Button>
          <Button variant="ghost" onClick={reset}>
            Importer un autre lien
          </Button>
        </div>
      )}
    </div>
  )
}
