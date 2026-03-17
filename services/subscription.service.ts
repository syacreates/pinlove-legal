/**
 * Subscription Service
 *
 * Handles freemium logic and Stripe payment integration.
 * In V1 the payment flow is mocked — no real Stripe call is made.
 * Production: integrate Stripe Checkout or Payment Element.
 */

import type { PremiumPurchase, User } from '@/lib/types'
import { PREMIUM_PRICE_EUR } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { authService } from './auth.service'
import { placesService } from './places.service'
import { FREE_PLAN_LIMIT } from '@/lib/constants'

// ── In-memory purchase log ────────────────────────────────────────────────────
let _purchases: PremiumPurchase[] = []

export const subscriptionService = {
  /** Check current plan status for a user. */
  async getPlanStatus(
    userId: string,
    userPlan: User['plan'],
  ): Promise<{
    plan: User['plan']
    placesCount: number
    placesRemaining: number
    isAtLimit: boolean
  }> {
    await delay(100)
    const count = await placesService.countPlaces(userId)
    const remaining = userPlan === 'premium' ? Infinity : Math.max(0, FREE_PLAN_LIMIT - count)
    return {
      plan: userPlan,
      placesCount: count,
      placesRemaining: remaining,
      isAtLimit: userPlan === 'free' && count >= FREE_PLAN_LIMIT,
    }
  },

  /**
   * Initiate a premium purchase.
   *
   * Production flow:
   *   1. Call /api/stripe/create-payment-intent
   *   2. Load Stripe.js and render Payment Element
   *   3. Confirm payment
   *   4. Webhook confirms → call upgradeToPremium()
   *
   * V1 mock: simulates a 1-second payment and upgrades immediately.
   */
  async purchasePremium(
    userId: string,
    _paymentMethodId?: string,
  ): Promise<{ success: boolean; purchase: PremiumPurchase | null; error: string | null }> {
    await delay(1500) // Simulate Stripe processing

    // Simulate a ~5% failure rate for realism
    if (Math.random() < 0.05) {
      return {
        success: false,
        purchase: null,
        error: 'Paiement refusé. Vérifie tes informations de carte.',
      }
    }

    const now = new Date().toISOString()
    const purchase: PremiumPurchase = {
      id: generateId(),
      user_id: userId,
      stripe_payment_intent_id: `pi_mock_${generateId()}`,
      amount_cents: Math.round(PREMIUM_PRICE_EUR * 100),
      currency: 'eur',
      status: 'succeeded',
      created_at: now,
    }

    _purchases = [purchase, ..._purchases]

    // Upgrade user in auth service
    await authService.upgradeToPremium()

    return { success: true, purchase, error: null }
  },

  /** Returns purchase history for a user. */
  async getPurchaseHistory(userId: string): Promise<PremiumPurchase[]> {
    await delay(200)
    return _purchases.filter(p => p.user_id === userId)
  },

  /**
   * Create a Stripe Checkout Session URL.
   * In production this calls the /api/stripe/checkout-session endpoint.
   */
  async createCheckoutSessionUrl(userId: string): Promise<string> {
    await delay(300)
    // In V1 we return the internal pricing page as a mock
    return `/pricing?mock_checkout=1&uid=${userId}`
  },
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
