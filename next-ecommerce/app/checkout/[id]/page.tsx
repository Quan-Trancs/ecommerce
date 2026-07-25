import { notFound } from 'next/navigation'
import React from 'react'

import { auth } from '@/auth'
import { getOrderById } from '@/lib/actions/order.actions'
import PaymentForm from './payment-form'
import { hasAdminAccess } from '@/lib/auth/roles'
import {
  createOrderPaymentIntent,
  isStripeConfigured,
} from '@/lib/stripe'

export const metadata = {
  title: 'Payment',
}

const CheckoutPaymentPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  const order = await getOrderById(id)
  if (!order) notFound()

  const session = await auth()

  let clientSecret: string | null = null
  if (order.paymentMethod === 'Stripe' && !order.isPaid && isStripeConfigured()) {
    try {
      const paymentIntent = await createOrderPaymentIntent({
        orderId: order._id,
        amountCents: Math.round(order.totalPrice * 100),
      })
      clientSecret = paymentIntent.client_secret
    } catch (e) {
      console.error('Stripe PaymentIntent create failed', e)
      clientSecret = null
    }
  }

  return (
    <PaymentForm
      order={order}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || 'sb'}
      clientSecret={clientSecret}
      isAdmin={hasAdminAccess(session?.user?.role)}
    />
  )
}

export default CheckoutPaymentPage
