'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ArrowLeft, Sparkles, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { subscriptionService } from '@/services/subscription.service'
import { authService } from '@/services/auth.service'
import { PREMIUM_FEATURES, PREMIUM_PRICE_DISPLAY, ROUTES } from '@/lib/constants'

export default function PricingPage() {
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const user           = useAuthStore(s => s.user)!
  const setUser        = useAuthStore(s => s.setUser)
  const addToast       = useAppStore(s => s.addToast)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Handle return from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true)
      // Refresh user from Supabase (webhook may have upgraded the plan)
      authService.getCurrentUser().then(u => { if (u) setUser(u) })
    }
    if (searchParams.get('cancelled') === 'true') {
      addToast({ type: 'info', message: 'Paiement annulé. Tu peux réessayer quand tu veux.' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePurchase() {
    setLoading(true)
    const { error } = await subscriptionService.purchasePremium(user.id, user.email)
    setLoading(false)
    if (error) {
      addToast({ type: 'error', message: error })
    }
    // If no error, the browser is being redirected to Stripe — no further action needed
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
        <Button variant="primary" onClick={() => router.back()}>Retour</Button>
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
        <div className="w-full max-w-xs space-y-3">
          {['Adresses illimitées débloquées', 'Partage avec tes amis activé', 'Import prioritaire activé'].map(f => (
            <div key={f} className="flex items-center gap-3 bg-brand-50 rounded-2xl px-4 py-3">
              <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <span className="text-sm font-medium text-brand-700">{f}</span>
            </div>
          ))}
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => router.replace(ROUTES.HOME)}
          fullWidth
          className="max-w-xs mt-8"
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
          <span className="text-4xl font-bold text-neutral-900">{PREMIUM_PRICE_DISPLAY}</span>
          <span className="text-neutral-500 text-sm">une fois</span>
        </div>
        <p className="text-xs text-neutral-400 mb-5">Pas d'abonnement. Pas de surprise.</p>

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
          {loading ? 'Redirection vers Stripe…' : `Débloquer Premium — ${PREMIUM_PRICE_DISPLAY}`}
        </Button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Shield className="w-3 h-3" /> Paiement sécurisé Stripe
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
          ['Adresses',          '5 max',  '∞ illimité'],
          ['Partage amis',      '—',      '✓'],
          ['Carte interactive', '✓',      '✓'],
          ['Import TikTok/IG',  '✓',      '✓ prioritaire'],
          ['Itinéraires',       '✓',      '✓'],
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
