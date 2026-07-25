import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { markOrderPaidFromWebhook } from '@/lib/payments/mark-paid'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 503 }
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('Stripe webhook signature failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as {
        id: string
        status: string
        amount_received?: number
        metadata?: { orderId?: string }
      }
      const orderId = pi.metadata?.orderId?.trim()
      if (!orderId) {
        console.warn('Stripe PI succeeded without orderId metadata', pi.id)
        return NextResponse.json({ received: true, skipped: 'no_order_id' })
      }

      await markOrderPaidFromWebhook(orderId, {
        id: pi.id,
        status: pi.status || 'succeeded',
        pricePaid:
          typeof pi.amount_received === 'number'
            ? (pi.amount_received / 100).toFixed(2)
            : undefined,
        paymentMethod: 'Stripe',
      })
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
