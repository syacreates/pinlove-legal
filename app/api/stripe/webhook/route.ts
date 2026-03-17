/**
 * Stripe webhook endpoint
 *
 * In production:
 *   1. Install stripe npm package
 *   2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.local
 *   3. Replace mock logic below with real Stripe event handling
 *
 * Stripe sends events here after a successful payment.
 * The handler upgrades the user's plan in Supabase.
 */

import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // ── Production implementation ──────────────────────────────────────────────
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })
  // let event: Stripe.Event
  // try {
  //   event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  // } catch (err) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  // }
  // if (event.type === 'payment_intent.succeeded') {
  //   const paymentIntent = event.data.object as Stripe.PaymentIntent
  //   const userId = paymentIntent.metadata.user_id
  //   // Update Supabase: set plan = 'premium' and premium_purchased_at = now()
  // }
  // return NextResponse.json({ received: true })
  // ──────────────────────────────────────────────────────────────────────────

  // Mock response for V1
  console.info('[stripe/webhook] Mock webhook received. Body length:', body.length)
  return NextResponse.json({ received: true, mock: true })
}
