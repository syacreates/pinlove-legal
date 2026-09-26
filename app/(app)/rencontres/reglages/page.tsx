'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  IntentionPicker,
  PhotoPicker,
  SafetyContactFields,
  ScreenHeader,
  Switch,
  isValidPhone,
} from '@/components/rencontres/RencontreUI'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { rencontresService } from '@/services/rencontres.service'
import { ROUTES } from '@/lib/constants'
import type { RencontreIntention, RencontreProfile } from '@/lib/types'

export default function RencontresReglagesPage() {
  const router      = useRouter()
  const user        = useAuthStore(s => s.user)!
  const profile     = useRencontreStore(s => s.profile)
  const loaded      = useRencontreStore(s => s.loaded)
  const loadProfile = useRencontreStore(s => s.loadProfile)

  useEffect(() => { loadProfile(user.id) }, [user.id, loadProfile])
  useEffect(() => {
    if (loaded && !profile?.principles_accepted_at) router.replace(ROUTES.RENCONTRES_ONBOARDING)
  }, [loaded, profile, router])

  if (!profile?.principles_accepted_at) {
    return (
      <div className="screen-scroll flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <SettingsForm profile={profile} />
}

function SettingsForm({ profile }: { profile: RencontreProfile }) {
  const router     = useRouter()
  const addToast   = useAppStore(s => s.addToast)
  const setProfile = useRencontreStore(s => s.setProfile)

  const [intention,    setIntention]    = useState<RencontreIntention>(profile.intention)
  const [firstName,    setFirstName]    = useState(profile.first_name)
  const [photoPath,    setPhotoPath]    = useState(profile.photo_path)
  const [contactName,  setContactName]  = useState(profile.safety_contact_name ?? '')
  const [contactPhone, setContactPhone] = useState(profile.safety_contact_phone ?? '')
  const [saving,       setSaving]       = useState(false)
  const [toggling,     setToggling]     = useState(false)

  async function handleToggle(enabled: boolean) {
    setToggling(true)
    const { profile: saved, error } = await rencontresService.updateProfile(profile.user_id, { enabled })
    setToggling(false)
    if (error || !saved) {
      addToast({ type: 'error', message: error ?? 'Modification impossible.' })
      return
    }
    setProfile(saved)
    addToast({
      type: 'success',
      message: enabled ? 'Mode Rencontres réactivé.' : 'Mode Rencontres en pause : personne ne te voit.',
    })
  }

  // La photo précédente est supprimée à l'envoi : on enregistre tout de suite
  // le nouveau chemin pour que le profil ne pointe jamais vers un fichier absent.
  async function handlePhotoChange(path: string) {
    setPhotoPath(path)
    const { profile: saved, error } = await rencontresService.updateProfile(profile.user_id, { photo_path: path })
    if (error || !saved) addToast({ type: 'error', message: error ?? 'Photo non enregistrée.' })
    else setProfile(saved)
  }

  async function handleSave() {
    if (!firstName.trim()) {
      addToast({ type: 'error', message: 'Indique ton prénom.' })
      return
    }
    if (!contactName.trim() || !isValidPhone(contactPhone)) {
      addToast({ type: 'error', message: 'Indique le prénom et le numéro de ton contact de confiance.' })
      return
    }
    setSaving(true)
    const { profile: saved, error } = await rencontresService.saveProfile(profile.user_id, {
      enabled:                profile.enabled,
      intention,
      first_name:             firstName.trim(),
      photo_path:             photoPath,
      safety_contact_name:    contactName.trim(),
      safety_contact_phone:   contactPhone.trim(),
      principles_accepted_at: profile.principles_accepted_at,
    })
    setSaving(false)
    if (error || !saved) {
      addToast({ type: 'error', message: error ?? 'Enregistrement impossible.' })
      return
    }
    setProfile(saved)
    addToast({ type: 'success', message: 'Réglages enregistrés.' })
  }

  return (
    <div className="screen-scroll px-4 pt-6 space-y-6">
      <ScreenHeader title="Réglages Rencontres" onBack={() => router.push(ROUTES.RENCONTRES)} />

      <section className="bg-paper rounded-card shadow-card p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-bold text-ink">Mode Rencontres</p>
          <p className="text-sm text-muted">
            {profile.enabled
              ? 'Actif : tu peux croiser des personnes dans tes lieux ouverts.'
              : 'En pause : personne ne te voit, tes lieux restent inchangés.'}
          </p>
        </div>
        <Switch
          checked={profile.enabled}
          onChange={handleToggle}
          disabled={toggling}
          label="Activer le mode Rencontres"
        />
      </section>

      <section className="bg-paper rounded-card shadow-card p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-ink">Fiabilité</p>
          <p className="text-sm text-muted">Baisse de 10 points en cas d’annulation moins de 12 h avant.</p>
        </div>
        <p className="font-display text-2xl text-accent">{profile.reliability_score}</p>
      </section>

      <section>
        <h2 className="text-lg text-ink mb-3">Intention</h2>
        <IntentionPicker value={intention} onChange={setIntention} />
        {intention !== profile.intention && (
          <p className="text-xs text-accent-dark mt-2 px-1">
            Le changement s’applique aux prochains moments ; ceux déjà proposés gardent leur intention.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg text-ink">Toi</h2>
        <Input
          id="first-name"
          label="Prénom"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          maxLength={40}
        />
        <PhotoPicker
          userId={profile.user_id}
          path={photoPath}
          onChange={handlePhotoChange}
          onError={message => addToast({ type: 'error', message })}
        />
      </section>

      <section>
        <h2 className="text-lg text-ink mb-3">Contact de confiance</h2>
        <SafetyContactFields
          name={contactName}
          phone={contactPhone}
          onNameChange={setContactName}
          onPhoneChange={setContactPhone}
        />
      </section>

      <Button fullWidth size="xl" loading={saving} onClick={handleSave}>
        Enregistrer
      </Button>
    </div>
  )
}
