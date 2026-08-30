'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { StampBadge } from '@/components/stamp/StampBadge'
import { ROUTES } from '@/lib/constants'

/**
 * Root page: splash screen + redirect logic.
 * - Authenticated users → Home
 * - New users → Onboarding
 */
export default function SplashPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const initialized = useAuthStore(s => s.initialized)

  useEffect(() => {
    if (!initialized) return

    const timer = setTimeout(() => {
      if (user) {
        router.replace(ROUTES.HOME)
      } else {
        const seen = localStorage.getItem('pinlove_onboarded')
        router.replace(seen ? ROUTES.LOGIN : ROUTES.ONBOARDING)
      }
    }, 1800) // Show splash for 1.8s

    return () => clearTimeout(timer)
  }, [initialized, user, router])

  return (
    <div className="fixed inset-0 premium-gradient flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="flex flex-col items-center gap-5 animate-scale-in">
        <StampBadge size="lg" />
        <div className="text-center">
          <h1 className="font-display font-extrabold uppercase text-4xl text-paper tracking-wide">PinLove</h1>
          <p className="font-mono text-mist text-sm mt-1.5">
            Tes lieux préférés, toujours à portée
          </p>
        </div>
      </div>

      {/* Loader dots */}
      <div className="absolute bottom-16 flex gap-2">
        <Dot delay="0ms"   />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <div
      className="w-2 h-2 rounded-full bg-white/60 animate-pulse-soft"
      style={{ animationDelay: delay }}
    />
  )
}
