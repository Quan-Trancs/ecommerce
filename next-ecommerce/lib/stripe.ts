import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2026-06-24.dahlia',
    })
  }
  return stripeClient
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

export async function createOrderPaymentIntent(opts: {
  orderId: string
  amountCents: number
  currency?: string
}) {
  const stripe = getStripe()
  return stripe.paymentIntents.create(
    {
      amount: opts.amountCents,
      currency: (opts.currency || 'usd').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: opts.orderId },
    },
    { idempotencyKey: `order-pi-${opts.orderId}-${opts.amountCents}` }
  )
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return getStripe().paymentIntents.retrieve(paymentIntentId)
}

export async function refundPaymentIntent(
  paymentIntentId: string,
  amountUsd?: number
) {
  const payload: { payment_intent: string; amount?: number } = {
    payment_intent: paymentIntentId,
  }
  if (amountUsd != null && Number.isFinite(amountUsd) && amountUsd > 0) {
    payload.amount = Math.round(amountUsd * 100)
  }
  return getStripe().refunds.create(payload)
}
