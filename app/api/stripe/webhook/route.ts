/**
 * POST /api/stripe/webhook
 * Handles Stripe events after payment.
 * On checkout.session.completed → upgrades user plan in Supabase.
 */

import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
    apiVersion: '2026-02-25.clover',
  })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
  )
}

export async function POST(req: NextRequest) {
  const stripe       = getStripe()
  const supabaseAdmin = getSupabaseAdmin()
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''
  const secret    = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  // Verify signature when webhook secret is configured
  if (secret) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signature invalide.'
      console.error('[webhook] Signature error:', message)
      return NextResponse.json({ error: message }, { status: 400 })
    }
  } else {
    // Dev mode without CLI — parse body directly (no signature check)
    event = JSON.parse(body) as Stripe.Event
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.user_id

    if (!userId) {
      console.error('[webhook] No user_id in session metadata')
      return NextResponse.json({ error: 'user_id manquant.' }, { status: 400 })
    }

    // 1. Upgrade user plan
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        plan: 'premium',
        premium_purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (userError) {
      console.error('[webhook] Failed to upgrade user:', userError.message)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // 2. Record purchase
    const { error: purchaseError } = await supabaseAdmin
      .from('premium_purchases')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent as string,
        amount_cents: session.amount_total ?? 999,
        currency: session.currency ?? 'eur',
        status: 'succeeded',
      })

    if (purchaseError) {
      console.error('[webhook] Failed to record purchase:', purchaseError.message)
      // Non-fatal — user is already upgraded
    }

    console.info(`[webhook] ✅ User ${userId} upgraded to premium`)
  }

  return NextResponse.json({ received: true })
}
