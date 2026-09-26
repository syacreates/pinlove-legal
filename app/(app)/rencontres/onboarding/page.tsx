'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  IntentionPicker,
  PhotoPicker,
  SafetyContactFields,
  ScreenHeader,
  isValidPhone,
} from '@/components/rencontres/RencontreUI'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { rencontresService } from '@/services/rencontres.service'
import { RENCONTRE_INTENTIONS, RENCONTRE_PRINCIPLES, ROUTES } from '@/lib/constants'
import type { RencontreIntention } from '@/lib/types'

const STEPS = ['principes', 'intention', 'identite', 'contact', 'recap'] as const
type Step = typeof STEPS[number]

const STEP_TITLES: Record<Step, { title: string; subtitle: string }> = {
  principes: { title: 'Rencontres',           subtitle: 'Rencontrer du monde à travers vos lieux préférés' },
  intention: { title: 'Ton intention',        subtitle: 'Ce que tu viens chercher' },
  identite:  { title: 'Comment t’appeler ?',  subtitle: 'Ton prénom et ta photo' },
  contact:   { title: 'Contact de confiance', subtitle: 'Quelqu’un à prévenir le jour J' },
  recap:     { title: 'C’est presque prêt',   subtitle: 'Vérifie avant d’activer' },
}

export default function RencontresOnboardingPage() {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const addToast    = useAppStore(s => s.addToast)
  const profile     = useRencontreStore(s => s.profile)
  const loaded      = useRencontreStore(s => s.loaded)
  const loadProfile = useRencontreStore(s => s.loadProfile)
  const setProfile  = useRencontreStore(s => s.setProfile)

  const [step,         setStep]         = useState<Step>('principes')
  const [intention,    setIntention]    = useState<RencontreIntention | null>(null)
  const [firstName,    setFirstName]    = useState(user.full_name.split(' ')[0] ?? '')
  const [photoPath,    setPhotoPath]    = useState<string | null>(null)
  const [contactName,  setContactName]  = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [saving,       setSaving]       = useState(false)
  // Vrai pendant l'activation : la redirection vers les lieux prime sur celle
  // des profils déjà inscrits.
  const activating = useRef(false)

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])

  // Déjà inscrit·e : direction l'accueil Rencontres.
  useEffect(() => {
    if (loaded && profile?.principles_accepted_at && !activating.current) router.replace(ROUTES.RENCONTRES)
  }, [loaded, profile, router])

  const index = STEPS.indexOf(step)

  function goBack() {
    if (index === 0) router.back()
    else setStep(STEPS[index - 1])
  }

  function goNext() {
    if (step === 'intention' && !intention) {
      addToast({ type: 'error', message: 'Choisis une intention.' })
      return
    }
    if (step === 'identite' && !firstName.trim()) {
      addToast({ type: 'error', message: 'Indique ton prénom.' })
      return
    }
    if (step === 'contact' && (!contactName.trim() || !isValidPhone(contactPhone))) {
      addToast({ type: 'error', message: 'Indique le prénom et le numéro de ton contact de confiance.' })
      return
    }
    setStep(STEPS[index + 1])
  }

  async function handleActivate() {
    if (!intention) return
    activating.current = true
    setSaving(true)
    const { profile: saved, error } = await rencontresService.saveProfile(user.id, {
      enabled:                true,
      intention,
      first_name:             firstName.trim(),
      photo_path:             photoPath,
      safety_contact_name:    contactName.trim(),
      safety_contact_phone:   contactPhone.trim(),
      principles_accepted_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error || !saved) {
      activating.current = false
      addToast({ type: 'error', message: error ?? 'Activation impossible.' })
      return
    }
    setProfile(saved)
    addToast({ type: 'success', message: 'Mode Rencontres activé. Choisis maintenant les lieux que tu ouvres.' })
    router.replace(ROUTES.RENCONTRES_LIEUX)
  }

  return (
    <div className="screen-scroll px-4 pt-6">
      <ScreenHeader {...STEP_TITLES[step]} onBack={goBack} />

      {/* Progression */}
      <div className="flex gap-1.5 mb-6" aria-label={`Étape ${index + 1} sur ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>

      {step === 'principes' && (
        <div className="space-y-3">
          <p className="text-ink-soft">
            Un mode optionnel pour rencontrer de nouvelles personnes autour d’un moment dans un lieu que
            vous aimez tous les deux. Sans les codes des applis de dating.
          </p>
          <ol className="space-y-2">
            {RENCONTRE_PRINCIPLES.map((p, i) => (
              <li key={p.title} className="bg-paper rounded-card shadow-card p-4 flex gap-3">
                <span className="font-display text-accent text-lg leading-none mt-0.5">{i + 1}</span>
                <div>
                  <p className="font-bold text-ink">{p.title}</p>
                  <p className="text-sm text-ink-soft">{p.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {step === 'intention' && <IntentionPicker value={intention} onChange={setIntention} />}

      {step === 'identite' && (
        <div className="space-y-6">
          <Input
            id="first-name"
            label="Ton prénom"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            maxLength={40}
            hint="C’est tout ce qui apparaît de toi avant l’acceptation, avec vos lieux communs."
          />
          <PhotoPicker
            userId={user.id}
            path={photoPath}
            onChange={setPhotoPath}
            onError={message => addToast({ type: 'error', message })}
          />
        </div>
      )}

      {step === 'contact' && (
        <SafetyContactFields
          name={contactName}
          phone={contactPhone}
          onNameChange={setContactName}
          onPhoneChange={setContactPhone}
        />
      )}

      {step === 'recap' && intention && (
        <div className="space-y-3">
          <dl className="bg-paper rounded-card shadow-card divide-y divide-divider text-sm">
            <RecapRow label="Intention" value={RENCONTRE_INTENTIONS[intention].label} />
            <RecapRow label="Prénom" value={firstName.trim()} />
            <RecapRow label="Photo" value={photoPath ? 'Ajoutée' : 'Aucune'} />
            <RecapRow label="Contact de confiance" value={`${contactName.trim()} · ${contactPhone.trim()}`} />
          </dl>
          <p className="text-sm text-ink-soft px-1">
            En activant, tu acceptes les principes des Rencontres. Tes lieux restent privés : tu choisis
            ensuite ceux que tu ouvres. Tu peux mettre le mode en pause à tout moment.
          </p>
        </div>
      )}

      <div className="mt-8">
        {step === 'recap' ? (
          <Button fullWidth size="xl" loading={saving} onClick={handleActivate}>
            Activer le mode Rencontres
          </Button>
        ) : (
          <Button fullWidth size="xl" onClick={goNext}>
            {step === 'principes' ? 'J’ai compris, on y va' : 'Continuer'}
          </Button>
        )}
      </div>
    </div>
  )
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold text-ink text-right truncate">{value}</dd>
    </div>
  )
}
