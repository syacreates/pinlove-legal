'use client'

import { useState } from 'react'
import { StampBadge } from '@/components/stamp/StampBadge'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/lib/constants'

/**
 * Root page: splash screen. Stays put until the user taps "Démarrer" — no
 * auto-redirect. Always leads to Onboarding (l'explication de l'app), même
 * pour un utilisateur déjà connecté — l'onboarding renvoie vers l'Accueil
 * à la fin dans ce cas (voir app/onboarding/page.tsx).
 */
export default function SplashPage() {
  const [leaving, setLeaving] = useState(false)

  function handleStart() {
    // Navigation "dure" (window.location) plutôt que le routeur client :
    // certains navigateurs ont laissé cet écran bloqué juste après le clic
    // avec une navigation SPA (router.replace). Un vrai changement de page
    // fonctionne de façon garantie partout, au prix d'un rechargement complet
    // ici — acceptable pour cette transition d'entrée, ponctuelle.
    // .replace() plutôt que .href= : n'ajoute pas d'entrée d'historique, donc
    // un retour arrière (bouton ou geste de bord Safari) depuis l'onboarding
    // ne peut pas ramener ici — il n'y a rien à "revenir" à ce splash.
    // L'onboarding (l'explication de l'app) s'affiche toujours, même pour un
    // utilisateur déjà connecté — il renvoie vers l'Accueil à la fin dans ce cas.
    setLeaving(true)
    window.location.replace(ROUTES.ONBOARDING)
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
          <h1 className="font-display font-extrabold uppercase text-4xl text-paper tracking-[0.06em]">PinLove</h1>
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
        <Button variant="primary" size="xl" fullWidth onClick={handleStart}>
          Démarrer
        </Button>
      </div>
    </div>
  )
}
