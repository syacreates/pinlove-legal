'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScreenHeader } from '@/components/rencontres/RencontreUI'
import { useAuthStore } from '@/stores/auth.store'
import { notificationsService } from '@/services/notifications.service'
import { pushMessage } from '@/supabase/functions/send-push/messages'
import { ROUTES } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import type { AppNotification } from '@/lib/types'

export default function NotificationsPage() {
  const router = useRouter()
  const user   = useAuthStore(s => s.user)!
  const [items, setItems] = useState<AppNotification[] | null>(null)

  useEffect(() => {
    notificationsService.list(user.id).then(list => {
      setItems(list)
      if (list.some(n => !n.read_at)) notificationsService.markAllRead(user.id)
    })
    return notificationsService.subscribe(user.id, n => setItems(list => [n, ...(list ?? [])]))
  }, [user.id])

  const shown = (items ?? [])
    .map(n => ({ n, text: pushMessage(n.type, n.payload) }))
    .filter(x => x.text)

  return (
    <div className="screen-scroll px-4 pt-6 space-y-4">
      <ScreenHeader title="Notifications" onBack={() => router.push(ROUTES.RENCONTRES)} />
      {items !== null && shown.length === 0 && (
        <div className="rounded-card border border-dashed border-dash p-5 text-center text-sm text-muted">
          Aucune notification pour l’instant.
        </div>
      )}
      <ul className="space-y-2">
        {shown.map(({ n, text }) => (
          <li key={n.id}>
            <Link
              href={n.moment_id ? ROUTES.RENCONTRES_MOMENT(n.moment_id) : ROUTES.RENCONTRES}
              className={cn(
                'block rounded-card p-4 shadow-card',
                n.read_at ? 'bg-paper' : 'bg-accent-light',
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bold text-ink">{text!.title}</p>
                <p className="text-xs text-muted flex-shrink-0">{timeAgo(n.created_at)}</p>
              </div>
              <p className="text-sm text-ink-soft mt-0.5">{text!.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
