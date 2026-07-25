'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lookupSupportOrder } from '@/lib/actions/support.actions'

export default function SupportOrderLookup() {
  const router = useRouter()
  const [orderId, setOrderId] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <form
      className='flex flex-wrap gap-2'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await lookupSupportOrder(orderId)
          if (!result.success) {
            toast.error(result.message)
            return
          }
          router.push(`/account/orders/${result.order._id}`)
        })
      }}
    >
      <Input
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        placeholder='Order id'
        className='max-w-md'
        aria-label='Order id'
      />
      <Button type='submit' disabled={pending || !orderId.trim()}>
        {pending ? 'Looking up…' : 'Open order'}
      </Button>
    </form>
  )
}
