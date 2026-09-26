'use client'

import { useState } from 'react'
import { StampBadge } from '@/components/stamp/StampBadge'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

/**
 * Root page: splash screen. Stays put until the user taps "Démarrer", which
 * leads to the Accueil — the app layout sends signed-out visitors to Login.
 */
export default function SplashPage() {
  const [leaving, setLeaving] = useState(false)

  function handleStart() {
    // Navigation "dure" (window.location) plutôt que le routeur client :
    // certains navigateurs ont laissé cet écran bloqué juste après le clic
    // avec une navigation SPA. .replace() : pas d'entrée d'historique, un
    // retour arrière ne ramène pas à ce splash.
    setLeaving(true)
    window.location.replace(ROUTES.HOME)
  }

  return (
    <>
      {/* Splash : fond crème du thème "Cerise". */}
      <div className="fixed inset-0 bg-neutral-50 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div
        className={`flex flex-col items-center gap-5 transition-all duration-300 ${
          leaving ? 'opacity-0 scale-90' : 'opacity-100 scale-100 animate-scale-in'
        }`}
      >
        <StampBadge size="lg" />
        <div className="text-center">
          <h1 className="font-display font-semibold text-4xl text-neutral-900 tracking-tight">PinLove</h1>
          <p className="text-mist text-[15px] mt-1.5">
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
        <Button variant="primary" size="xl" fullWidth onClick={handleStart}>
          Démarrer
        </Button>
      </div>
      </div>
    </>
  )
}
