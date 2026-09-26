'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { CardSkeleton } from '@/components/ui/Card'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { momentsService } from '@/services/moments.service'
import { ROUTES } from '@/lib/constants'
import { cn, formatSlot } from '@/lib/utils'
import type { MyRencontre } from '@/lib/types'

type Tab = 'upcoming' | 'past'

function isUpcoming(r: MyRencontre): boolean {
  if (r.status === 'open') return true
  if (r.status === 'matched' || r.status === 'confirmed') {
    return new Date(r.scheduled_at!).getTime() + r.duration_min * 60_000 > Date.now()
  }
  return false
}

function statusLabel(r: MyRencontre): { label: string; accent: boolean } {
  switch (r.status) {
    case 'open':
      return r.my_role === 'creator'
        ? { label: r.request_count ? `${r.request_count} partant·e${r.request_count > 1 ? 's' : ''} : à valider` : 'En attente de réponses', accent: !!r.request_count }
        : { label: 'Demande envoyée', accent: false }
    case 'matched':
      return r.needs_my_confirmation
        ? { label: 'À confirmer', accent: true }
        : { label: 'En attente de confirmation', accent: false }
    case 'confirmed': return { label: 'Confirmé', accent: false }
    case 'done':      return { label: 'Passé', accent: false }
    case 'cancelled': return { label: 'Annulé', accent: false }
    default:          return { label: r.scheduled_at ? 'Non confirmé' : 'Expiré', accent: false }
  }
}

export default function MesRencontresPage() {
  const router = useRouter()
  const [items, setItems] = useState<MyRencontre[] | null>(null)
  const [tab,   setTab]   = useState<Tab>('upcoming')

  useEffect(() => { momentsService.getMyRencontres().then(setItems) }, [])

  const upcoming = (items ?? []).filter(isUpcoming)
    .sort((a, b) => new Date(a.scheduled_at ?? a.proposed_slots[0]).getTime() - new Date(b.scheduled_at ?? b.proposed_slots[0]).getTime())
  const past = (items ?? []).filter(r => !isUpcoming(r))
  const shown = tab === 'upcoming' ? upcoming : past

  return (
    <div className="screen-scroll px-4 pt-6 space-y-4">
      <ScreenHeader title="Mes rencontres" onBack={() => router.push(ROUTES.RENCONTRES)} />

      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-neutral-100" role="tablist">
        {([['upcoming', `À venir (${upcoming.length})`], ['past', `Passées (${past.length})`]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'h-10 rounded-full text-sm font-bold transition-all',
              tab === key ? 'bg-paper shadow-card text-ink' : 'text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : shown.length === 0 ? (
        <div className="rounded-card border border-dashed border-dash p-5 text-center text-sm text-muted">
          {tab === 'upcoming' ? 'Rien de prévu pour l’instant. Jette un œil aux moments dans tes lieux !' : 'Pas encore de rencontre passée.'}
        </div>
      ) : (
        <ul className="bg-paper rounded-card shadow-card divide-y divide-divider">
          {shown.map(r => {
            const status = statusLabel(r)
            return (
              <li key={r.id}>
                <Link href={ROUTES.RENCONTRES_MOMENT(r.id)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink/5">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink truncate">
                      {r.title}{r.other_first_name && <span className="font-normal text-ink-soft"> · avec {r.other_first_name}</span>}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {r.place_name} · {r.scheduled_at ? formatSlot(r.scheduled_at) : formatSlot(r.my_chosen_slot ?? r.proposed_slots[0])}
                    </p>
                    <p className={cn('text-xs font-bold mt-1', status.accent ? 'text-accent' : 'text-ink-soft')}>{status.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink/30 flex-shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
