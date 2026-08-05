/**
 * POST /api/stripe/checkout-session
 * Creates a Stripe Checkout Session for the Premium plan.
 * Returns { url } to redirect the user to Stripe's hosted checkout page.
 */

import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
    apiVersion: '2026-02-25.clover',
  })

  try {
    const { userId, userEmail } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId requis.' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: userEmail ?? undefined,
      metadata: { user_id: userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe.'
    console.error('[stripe/checkout-session]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
