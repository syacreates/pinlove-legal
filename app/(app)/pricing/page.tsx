'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, Sparkles, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { subscriptionService } from '@/services/subscription.service'
import { PREMIUM_FEATURES, PREMIUM_PRICE_DISPLAY, ROUTES } from '@/lib/constants'

export default function PricingPage() {
  const router   = useRouter()
  const user     = useAuthStore(s => s.user)!
  const upgradeToPremium = useAuthStore(s => s.upgradeToPremium)
  const addToast = useAppStore(s => s.addToast)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    const { success: ok, error } = await subscriptionService.purchasePremium(user.id)
    setLoading(false)

    if (!ok || error) {
      addToast({ type: 'error', message: error ?? 'Paiement échoué. Réessaie.' })
    } else {
      await upgradeToPremium()
      setSuccess(true)
    }
  }

  if (user.plan === 'premium' && !success) {
    return (
      <div className="screen-scroll flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-brand-500" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Tu es déjà Premium ✦</h2>
        <p className="text-neutral-500 text-sm mb-8">
          Toutes les fonctionnalités sont déjà débloquées. Profite de PinLove sans limite !
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="screen-scroll flex flex-col items-center justify-center px-6 text-center animate-scale-in">
        <div className="w-24 h-24 premium-gradient rounded-full flex items-center justify-center mb-5 shadow-floating">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Bienvenue en Premium ✦</h2>
        <p className="text-neutral-500 text-sm mb-8 max-w-xs">
          Adresses illimitées, partage avec tes amis et bien plus. Profite pleinement de PinLove !
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.replace(ROUTES.HOME)}
          fullWidth
          className="max-w-xs"
        >
          Découvrir mes nouvelles fonctionnalités
        </Button>
      </div>
    )
  }

  return (
    <div className="screen-scroll px-4 pt-6 pb-8">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-neutral-600 text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 premium-gradient rounded-3xl mb-4 shadow-floating">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">PinLove Premium</h1>
        <p className="text-neutral-500 text-sm">Un paiement unique. Pour toujours.</p>
      </div>

      {/* Price card */}
      <div className="bg-white rounded-3xl shadow-card p-6 mb-5 ring-2 ring-brand-500">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold text-neutral-900">
            {PREMIUM_PRICE_DISPLAY}
          </span>
          <span className="text-neutral-500 text-sm">une fois</span>
        </div>
        <p className="text-xs text-neutral-400 mb-5">Pas d'abonnement. Pas de surprise.</p>

        {/* Features list */}
        <ul className="space-y-3 mb-6">
          {PREMIUM_FEATURES.map(f => (
            <li key={f.label} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{f.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{f.label}</p>
                <p className="text-xs text-neutral-500">{f.sub}</p>
              </div>
            </li>
          ))}
        </ul>

        <Button
          variant="primary"
          size="xl"
          fullWidth
          loading={loading}
          onClick={handlePurchase}
          className="shadow-floating"
        >
          Débloquer Premium — {PREMIUM_PRICE_DISPLAY}
        </Button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Shield className="w-3 h-3" /> Paiement sécurisé
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Zap className="w-3 h-3" /> Activation immédiate
          </span>
        </div>
      </div>

      {/* Compare plans */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden mb-5">
        <div className="grid grid-cols-3 text-center text-xs font-semibold bg-neutral-50 py-3 px-4">
          <span className="text-left text-neutral-500">Fonctionnalité</span>
          <span className="text-neutral-700">Gratuit</span>
          <span className="text-brand-500">Premium</span>
        </div>
        {[
          ['Adresses',         '5 max',   '∞ illimité'],
          ['Partage amis',     '—',       '✓'],
          ['Carte interactive','✓',       '✓'],
          ['Import TikTok/IG', '✓',       '✓ prioritaire'],
          ['Itinéraires',      '✓',       '✓'],
        ].map(([feat, free, prem]) => (
          <div key={feat} className="grid grid-cols-3 text-center text-xs py-3 px-4 border-t border-neutral-50">
            <span className="text-left text-neutral-600">{feat}</span>
            <span className="text-neutral-400">{free}</span>
            <span className="text-brand-600 font-semibold">{prem}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-neutral-400">
        Questions ? <a href="mailto:support@pinlove.app" className="underline">support@pinlove.app</a>
      </p>
    </div>
  )
}
