'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { StampBadge } from '@/components/stamp/StampBadge'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

/**
 * Root page: splash screen + redirect logic.
 * Stays put until the user taps "Démarrer" — no auto-redirect.
 * - Authenticated users → Home
 * - Everyone else → Onboarding (l'explication de l'app), à chaque fois.
 *   Un utilisateur qui a déjà un compte peut toujours passer directement à
 *   la connexion via "Passer →" ou "J'ai déjà un compte" sur l'onboarding.
 */
export default function SplashPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const initialized = useAuthStore(s => s.initialized)
  const [leaving, setLeaving] = useState(false)

  function handleStart() {
    // Navigue tout de suite — ne fait jamais attendre la navigation derrière
    // l'animation, qui reste purement visuelle (elle joue pendant que la
    // page suivante se charge, sans bloquer si un appareil est plus lent).
    setLeaving(true)
    router.replace(user ? ROUTES.HOME : ROUTES.ONBOARDING)
  }

  return (
    <div className="fixed inset-0 premium-gradient flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div
        className={`flex flex-col items-center gap-5 transition-all duration-300 ${
          leaving ? 'opacity-0 scale-90' : 'opacity-100 scale-100 animate-scale-in'
        }`}
      >
        <StampBadge size="lg" />
        <div className="text-center">
          <h1 className="font-display font-extrabold uppercase text-4xl text-paper tracking-wide">PinLove</h1>
          <p className="font-mono text-mist text-sm mt-1.5">
            Tes lieux préférés, toujours à portée
          </p>
        </div>
      </div>

      {/* CTA */}
      <div
        className={`absolute bottom-16 w-full max-w-xs px-6 transition-opacity duration-300 ${
          leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {initialized ? (
          <Button variant="primary" size="xl" fullWidth onClick={handleStart}>
            Démarrer
          </Button>
        ) : (
          <div className="flex justify-center gap-2 py-3.5">
            <Dot delay="0ms"   />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </div>
        )}
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
