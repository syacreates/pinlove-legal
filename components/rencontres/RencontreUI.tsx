'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Check } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { RENCONTRE_INTENTIONS, WHY_TEXT_MAX } from '@/lib/constants'
import { rencontresService } from '@/services/rencontres.service'
import type { RencontreIntention } from '@/lib/types'

// ── En-tête d'écran ──────────────────────────────────────────────────────────

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  back = true,
  action,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  back?: boolean
  /** Élément affiché à droite (ex. cloche de notifications) */
  action?: React.ReactNode
}) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-3 mb-6">
      {back && (
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          aria-label="Retour"
          className="w-10 h-10 flex-shrink-0 bg-surface rounded-2xl shadow-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-900/70" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl text-neutral-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Interrupteur ─────────────────────────────────────────────────────────────

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-12 h-7 flex-shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
        checked ? 'bg-accent' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-5 h-5 rounded-full bg-surface shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

// ── Choix de l'intention ─────────────────────────────────────────────────────

export function IntentionPicker({
  value,
  onChange,
}: {
  value: RencontreIntention | null
  onChange: (value: RencontreIntention) => void
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Intention">
      {(Object.keys(RENCONTRE_INTENTIONS) as RencontreIntention[]).map(key => {
        const meta = RENCONTRE_INTENTIONS[key]
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
              selected ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:border-dash',
            )}
          >
            <div className="flex-1">
              <p className="font-bold text-neutral-900">{meta.label}</p>
              <p className="text-sm text-mist">{meta.description}</p>
            </div>
            {selected && <Check className="w-5 h-5 text-accent flex-shrink-0" />}
          </button>
        )
      })}
      <p className="text-xs text-muted px-1">
        Tu ne croiseras que des personnes ayant choisi la même intention.
      </p>
    </div>
  )
}

// ── Photo ────────────────────────────────────────────────────────────────────

export function PhotoPicker({
  userId,
  path,
  onChange,
  onError,
}: {
  userId: string
  path: string | null
  onChange: (path: string) => void
  onError: (message: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!path) { setUrl(null); return }
    rencontresService.getPhotoUrl(path).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [path])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { onError('Choisis une image.'); return }
    setUploading(true)
    const { path: newPath, error } = await rencontresService.uploadPhoto(userId, file, path)
    setUploading(false)
    if (error || !newPath) onError(error ?? 'Envoi de la photo impossible.')
    else onChange(newPath)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={path ? 'Changer la photo' : 'Ajouter une photo'}
        className="relative w-24 h-24 flex-shrink-0 rounded-card overflow-hidden bg-placeholder border border-dashed border-dash flex items-center justify-center"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Ta photo" className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-7 h-7 text-muted" />
        )}
        {uploading && (
          <span className="absolute inset-0 bg-ink/40 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-paper border-t-transparent rounded-full animate-spin" />
          </span>
        )}
      </button>
      <div className="text-sm">
        <p className="font-bold text-neutral-900">{path ? 'Changer la photo' : 'Ajouter une photo'}</p>
        <p className="text-muted">
          Révélée seulement après double acceptation d’un moment.
        </p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Contact de confiance ─────────────────────────────────────────────────────

export function SafetyContactFields({
  name,
  phone,
  onNameChange,
  onPhoneChange,
}: {
  name: string
  phone: string
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
}) {
  return (
    <div className="space-y-4">
      <Input
        id="safety-name"
        label="Prénom de ton contact"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Ex : Léa"
        maxLength={60}
        autoComplete="off"
      />
      <Input
        id="safety-phone"
        label="Son numéro de téléphone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={e => onPhoneChange(e.target.value)}
        placeholder="Ex : 06 12 34 56 78"
        maxLength={30}
        autoComplete="off"
      />
      <p className="text-xs text-muted px-1">
        Le jour J, tu pourras lui envoyer le lieu, l’heure et le prénom de la personne en un geste,
        et le bouton d’alerte lui transmettra ta position. Ce numéro n’est jamais visible par les autres.
      </p>
    </div>
  )
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/[^\d+]/g, '').length >= 6
}

// ── « Pourquoi j'aime ce lieu » ──────────────────────────────────────────────

export function WhyTextField({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (value: string) => void
  id: string
}) {
  return (
    <div>
      <Textarea
        id={id}
        label="Pourquoi tu aimes ce lieu"
        value={value}
        onChange={e => onChange(e.target.value.slice(0, WHY_TEXT_MAX))}
        placeholder="Ex : la lumière du matin et les pâtisseries maison"
        maxLength={WHY_TEXT_MAX}
        rows={2}
      />
      <p className="text-xs text-muted text-right mt-1">{value.length}/{WHY_TEXT_MAX}</p>
    </div>
  )
}
