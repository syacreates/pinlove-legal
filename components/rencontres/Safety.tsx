'use client'

import { useState } from 'react'
import { Flag, LifeBuoy, Phone, Send, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { useAppStore } from '@/stores/app.store'
import { useRencontreStore } from '@/stores/rencontre.store'
import { momentsService } from '@/services/moments.service'
import { getCurrentPosition, mapsLink, smsUrl } from '@/lib/geo'
import { REPORT_REASONS } from '@/lib/constants'
import { cn, formatSlot } from '@/lib/utils'
import type { MomentDetail, ReportReason } from '@/lib/types'

// ── Signalement (accessible partout) ─────────────────────────────────────────

export function ReportButton({
  momentId,
  personName,
  requestToken,
  onReported,
  className,
}: {
  momentId: string
  /** Prénom de la personne signalée (affichage) */
  personName: string
  /** Créateur signalant l'auteur d'une demande */
  requestToken?: string
  onReported?: () => void
  className?: string
}) {
  const addToast = useAppStore(s => s.addToast)
  const [open,    setOpen]    = useState(false)
  const [reason,  setReason]  = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [busy,    setBusy]    = useState(false)

  async function submit() {
    if (!reason) return
    setBusy(true)
    const { error } = await momentsService.report(momentId, reason, details, requestToken)
    setBusy(false)
    if (error) { addToast({ type: 'error', message: error }); return }
    setOpen(false)
    addToast({ type: 'success', message: `Merci. ${personName} ne croisera plus ta route sur PinLove.` })
    onReported?.()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink', className)}
      >
        <Flag className="w-3.5 h-3.5" /> Signaler {personName}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Signaler ${personName}`}>
        <p className="text-sm text-ink-soft mb-3">
          {personName} ne sera pas prévenu·e. Vous ne vous croiserez plus sur PinLove, et l’équipe examinera le signalement.
        </p>
        <div className="space-y-2 mb-3" role="radiogroup" aria-label="Motif">
          {(Object.keys(REPORT_REASONS) as ReportReason[]).map(key => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={reason === key}
              onClick={() => setReason(key)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-medium',
                reason === key ? 'border-accent bg-accent-light text-ink' : 'border-line bg-paper text-ink-soft',
              )}
            >
              {REPORT_REASONS[key]}
            </button>
          ))}
        </div>
        <Textarea
          id="report-details"
          label="Détails (facultatif)"
          value={details}
          onChange={e => setDetails(e.target.value.slice(0, 1000))}
          rows={3}
        />
        <Button className="mt-4" fullWidth variant="danger" loading={busy} disabled={!reason} onClick={submit}>
          Envoyer le signalement
        </Button>
      </Modal>
    </>
  )
}

// ── Prévenir le contact de confiance ─────────────────────────────────────────

function momentSummary(m: MomentDetail): string {
  const who = m.other?.first_name ?? 'quelqu’un'
  const where = [m.place_name, m.place_address].filter(Boolean).join(', ')
  return `Je vois ${who} pour « ${m.title} » à ${where}, ${m.scheduled_at ? formatSlot(m.scheduled_at) : ''}. `
    + `Lieu : ${mapsLink(m.latitude, m.longitude)} — Rencontre organisée via PinLove.`
}

export function ShareWithContactButton({ moment }: { moment: MomentDetail }) {
  const profile  = useRencontreStore(s => s.profile)
  const addToast = useAppStore(s => s.addToast)
  const name  = profile?.safety_contact_name
  const phone = profile?.safety_contact_phone
  const text  = momentSummary(moment)

  async function shareElsewhere() {
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); addToast({ type: 'success', message: 'Message copié.' }) }
    } catch {
      // Partage annulé
    }
  }

  return (
    <div className="flex gap-2">
      {phone ? (
        <a
          href={smsUrl(phone, text)}
          className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-ink text-white text-sm font-bold"
        >
          <Send className="w-4 h-4" /> Prévenir {name ?? 'mon contact'}
        </a>
      ) : (
        <p className="flex-1 text-sm text-muted">Ajoute un contact de confiance dans les réglages Rencontres.</p>
      )}
      <button
        type="button"
        onClick={shareElsewhere}
        aria-label="Partager autrement"
        className="w-11 h-11 flex-shrink-0 rounded-full border border-line flex items-center justify-center text-ink"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Bouton d'alerte discret ──────────────────────────────────────────────────

export function AlertButton({ moment, className }: { moment: MomentDetail; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink', className)}
      >
        <LifeBuoy className="w-3.5 h-3.5" /> Besoin d’aide ?
      </button>
      <AlertSheet moment={moment} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function AlertSheet({ moment, open, onClose }: { moment: MomentDetail; open: boolean; onClose: () => void }) {
  const profile = useRencontreStore(s => s.profile)
  const [busy, setBusy] = useState(false)
  const phone = profile?.safety_contact_phone
  const name  = profile?.safety_contact_name ?? 'mon contact'

  async function sendAlert() {
    if (!phone) return
    setBusy(true)
    let where = [moment.place_name, moment.place_address].filter(Boolean).join(', ')
    try {
      const pos = await getCurrentPosition()
      where = `${mapsLink(pos.lat, pos.lng)} (précision ${pos.accuracy} m)`
    } catch {
      // Pas de position : on envoie l'adresse du lieu.
    }
    setBusy(false)
    const text = `ALERTE PinLove : j’ai besoin d’aide. Ma position : ${where}. `
      + `Rendez-vous « ${moment.title} » à ${moment.place_name} avec ${moment.other?.first_name ?? 'une personne rencontrée via PinLove'}.`
    window.location.href = smsUrl(phone, text)
  }

  return (
    <Modal open={open} onClose={onClose} title="Besoin d’aide ?">
      <div className="space-y-3">
        <Button fullWidth size="lg" variant="secondary" loading={busy} disabled={!phone} onClick={sendAlert} leftIcon={<Send className="w-4 h-4" />}>
          Envoyer ma position à {name}
        </Button>
        <a
          href="tel:112"
          className="w-full inline-flex items-center justify-center gap-2 h-[46px] rounded-full bg-red-600 text-white font-bold"
        >
          <Phone className="w-4 h-4" /> Appeler le 112
        </a>
        <p className="text-xs text-muted">
          Le SMS s’ouvre pré-rempli avec ta position : il ne reste qu’à l’envoyer. Le 112 est le numéro d’urgence européen, gratuit.
        </p>
      </div>
    </Modal>
  )
}
