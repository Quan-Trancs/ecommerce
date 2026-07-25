'use client'

import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { approveStripeOrder } from '@/lib/actions/order.actions'
import ProductPrice from '@/components/shared/product/product-price'

export default function StripeForm({
  orderId,
  priceInCents,
}: {
  orderId: string
  priceInCents: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className='space-y-3'
      onSubmit={(e) => {
        e.preventDefault()
        if (!stripe || !elements) return

        startTransition(async () => {
          setErrorMessage(null)
          const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
          })

          if (error) {
            setErrorMessage(error.message || 'Payment failed')
            toast.error(error.message || 'Payment failed')
            return
          }

          if (!paymentIntent || paymentIntent.status !== 'succeeded') {
            const msg = `Payment status: ${paymentIntent?.status || 'unknown'}`
            setErrorMessage(msg)
            toast.error(msg)
            return
          }

          const result = await approveStripeOrder(orderId, {
            paymentIntentId: paymentIntent.id,
          })
          if (!result.success) {
            setErrorMessage(result.message)
            toast.error(result.message)
            return
          }

          toast.success(result.message)
          router.push(`/account/orders/${orderId}`)
          router.refresh()
        })
      }}
    >
      <PaymentElement />
      {errorMessage ? (
        <p className='text-sm text-destructive'>{errorMessage}</p>
      ) : null}
      <Button
        type='submit'
        className='w-full rounded-full'
        disabled={!stripe || !elements || pending}
      >
        {pending ? (
          'Processing…'
        ) : (
          <>
            Pay <ProductPrice price={priceInCents / 100} plain />
          </>
        )}
      </Button>
    </form>
  )
}
