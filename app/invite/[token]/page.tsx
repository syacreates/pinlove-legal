'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserPlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { friendsService } from '@/services/friends.service'
import { ROUTES } from '@/lib/constants'

export default function InvitePage() {
  const { token }  = useParams<{ token: string }>()
  const router     = useRouter()
  const user       = useAuthStore(s => s.user)
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message,  setMessage]  = useState('')

  useEffect(() => {
    if (!user) {
      // Redirect to signup with token saved for after auth
      localStorage.setItem('pinlove_pending_invite', token)
      router.replace(ROUTES.SIGNUP)
    }
  }, [user, token, router])

  async function handleAccept() {
    if (!user) return
    setStatus('loading')
    const { connection, error } = await friendsService.acceptInvite(token, user)
    if (error) {
      setStatus('error')
      setMessage(error)
    } else {
      setStatus('success')
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6 text-center">
      {status === 'success' ? (
        <>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Vous êtes connectés !</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Tu peux maintenant voir et partager des spots avec ton nouvel ami.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.replace(ROUTES.FRIENDS)}>
            Voir mes amis
          </Button>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-10 h-10 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Invitation PinLove
          </h2>
          <p className="text-neutral-500 text-sm mb-6 max-w-xs">
            Quelqu'un t'a invité à rejoindre ses contacts sur PinLove. Accepte pour partager vos spots favoris.
          </p>

          {status === 'error' && (
            <p className="text-sm text-red-500 mb-4">{message}</p>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="max-w-xs"
            loading={status === 'loading'}
            onClick={handleAccept}
          >
            Accepter l'invitation
          </Button>
          <button
            onClick={() => router.replace(ROUTES.HOME)}
            className="mt-4 text-sm text-neutral-400"
          >
            Plus tard
          </button>
        </>
      )}
    </div>
  )
}
