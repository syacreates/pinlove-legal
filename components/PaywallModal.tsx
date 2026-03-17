'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/stores/app.store'
import { PREMIUM_FEATURES, PREMIUM_PRICE_DISPLAY, ROUTES } from '@/lib/constants'

/**
 * Global paywall modal — triggered when the user hits the free plan limit.
 * Mount once in the app shell layout.
 */
export function PaywallModal() {
  const router      = useRouter()
  const paywallOpen = useAppStore(s => s.paywallOpen)
  const closePaywall = useAppStore(s => s.closePaywall)

  function handleUpgrade() {
    closePaywall()
    router.push(ROUTES.PRICING)
  }

  return (
    <Modal open={paywallOpen} onClose={closePaywall} title="">
      <div className="text-center pt-2 pb-4">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 premium-gradient rounded-3xl mb-4 shadow-floating">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-xl font-bold text-neutral-900 mb-1">
          Limite gratuite atteinte 🚫
        </h2>
        <p className="text-sm text-neutral-500 mb-5 max-w-xs mx-auto">
          Tu as atteint la limite de 5 adresses du plan gratuit. Passe en premium une fois pour tout débloquer.
        </p>

        {/* Top 3 features */}
        <div className="space-y-2.5 text-left mb-6">
          {PREMIUM_FEATURES.slice(0, 3).map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{f.icon}</span>
              <span className="text-sm font-medium text-neutral-800">{f.label}</span>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          className="shadow-floating mb-3"
          onClick={handleUpgrade}
        >
          Débloquer Premium — {PREMIUM_PRICE_DISPLAY}
        </Button>

        <button
          onClick={closePaywall}
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Pas maintenant
        </button>
      </div>
    </Modal>
  )
}
