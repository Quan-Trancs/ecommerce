import { NextRequest, NextResponse } from 'next/server'
import { paypal } from '@/lib/paypal'
import { markOrderPaidFromWebhook } from '@/lib/payments/mark-paid'

export const runtime = 'nodejs'

type PayPalWebhookEvent = {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { value?: string; currency_code?: string }
    supplementary_data?: {
      related_ids?: { order_id?: string }
    }
  }
}

async function resolveStoreOrderId(resource: PayPalWebhookEvent['resource']) {
  if (!resource) return null
  if (resource.custom_id?.trim()) return resource.custom_id.trim()

  const paypalOrderId = resource.supplementary_data?.related_ids?.order_id
  if (!paypalOrderId) return null

  try {
    const order = await paypal.getOrder(paypalOrderId)
    const customId = order?.purchase_units?.[0]?.custom_id
    if (customId) return String(customId).trim()
    const invoiceId = order?.purchase_units?.[0]?.invoice_id
    if (invoiceId) return String(invoiceId).trim()
  } catch (err) {
    console.warn('PayPal getOrder for webhook failed:', err)
  }
  return null
}

export async function POST(request: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    return NextResponse.json(
      { error: 'PAYPAL_WEBHOOK_ID is not configured' },
      { status: 503 }
    )
  }

  const transmissionId = request.headers.get('paypal-transmission-id')
  const transmissionTime = request.headers.get('paypal-transmission-time')
  const certUrl = request.headers.get('paypal-cert-url')
  const authAlgo = request.headers.get('paypal-auth-algo')
  const transmissionSig = request.headers.get('paypal-transmission-sig')

  if (
    !transmissionId ||
    !transmissionTime ||
    !certUrl ||
    !authAlgo ||
    !transmissionSig
  ) {
    return NextResponse.json({ error: 'Missing PayPal webhook headers' }, { status: 400 })
  }

  const webhookEvent = (await request.json()) as PayPalWebhookEvent

  try {
    const verification = await paypal.verifyWebhookSignature({
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookId,
      webhookEvent,
    })
    if (verification.verification_status !== 'SUCCESS') {
      return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 })
    }
  } catch (err) {
    console.error('PayPal webhook verify failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verify failed' },
      { status: 400 }
    )
  }

  try {
    if (webhookEvent.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = webhookEvent.resource
      const orderId = await resolveStoreOrderId(resource)
      if (!orderId) {
        console.warn('PayPal capture completed without store order id', resource?.id)
        return NextResponse.json({ received: true, skipped: 'no_order_id' })
      }

      await markOrderPaidFromWebhook(orderId, {
        id: resource?.supplementary_data?.related_ids?.order_id || resource?.id || 'paypal',
        captureId: resource?.id,
        status: resource?.status || 'COMPLETED',
        pricePaid: resource?.amount?.value,
        paymentMethod: 'PayPal',
      })
    }
  } catch (err) {
    console.error('PayPal webhook handler error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
