/**
 * Subscription Service — Stripe Checkout réel
 */

import type { User } from '@/lib/types'
import { FREE_PLAN_LIMIT } from '@/lib/constants'
import { placesService } from './places.service'

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
   * Redirects to Stripe Checkout for the Premium plan.
   * Calls /api/stripe/checkout-session → gets URL → redirects browser.
   */
  async purchasePremium(
    userId: string,
    userEmail?: string,
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        return { success: false, error: data.error ?? 'Erreur lors de la création du paiement.' }
      }

      // Redirect to Stripe hosted checkout
      if (data.url && typeof window !== 'undefined') {
        window.location.href = data.url
      }

      return { success: true, error: null }
    } catch {
      return { success: false, error: 'Impossible de contacter le serveur de paiement.' }
    }
  },
}
