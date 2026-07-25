'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { markSellerOrderShipped } from '@/lib/actions/seller.actions'

export default function SellerShipOrderButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type='button'
      size='sm'
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await markSellerOrderShipped(orderId)
          if (result.success) {
            toast.success('Your line items marked as shipped')
          } else {
            toast.error(result.message || 'Could not mark shipped')
          }
        })
      }}
    >
      {pending ? 'Shipping…' : 'Mark shipped'}
    </Button>
  )
}
