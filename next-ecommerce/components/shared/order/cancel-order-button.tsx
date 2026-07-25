'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cancelOrder } from '@/lib/actions/order.actions'

export default function CancelOrderButton({
  orderId,
  label = 'Cancel order',
}: {
  orderId: string
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type='button'
      variant='outline'
      className='w-full'
      disabled={pending}
      onClick={() => {
        if (!window.confirm('Cancel this order? Reserved stock will be restored.')) {
          return
        }
        startTransition(async () => {
          const result = await cancelOrder(orderId)
          if (result.success) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      {pending ? 'Cancelling…' : label}
    </Button>
  )
}
