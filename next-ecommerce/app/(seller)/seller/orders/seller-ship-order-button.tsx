'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { markSellerOrderShipped } from '@/lib/actions/seller.actions'
import { SHIPPING_CARRIERS } from '@/lib/shipping/tracking'

export default function SellerShipOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  if (!open) {
    return (
      <Button
        type='button'
        size='sm'
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        Mark shipped
      </Button>
    )
  }

  return (
    <form
      className='flex max-w-md flex-wrap items-end gap-2'
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await markSellerOrderShipped({
            orderId,
            carrier: carrier || undefined,
            trackingNumber: trackingNumber || undefined,
          })
          if (result.success) {
            toast.success('Your line items marked as shipped')
            setOpen(false)
            setCarrier('')
            setTrackingNumber('')
            router.refresh()
          } else {
            toast.error(result.message || 'Could not mark shipped')
          }
        })
      }}
    >
      <label className='space-y-1 text-xs'>
        <span className='text-muted-foreground'>Carrier</span>
        <select
          className='block h-9 min-w-[140px] rounded-md border bg-background px-2 text-sm'
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          disabled={pending}
        >
          <option value=''>Optional</option>
          {SHIPPING_CARRIERS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className='space-y-1 text-xs'>
        <span className='text-muted-foreground'>Tracking #</span>
        <input
          className='block h-9 min-w-[160px] rounded-md border bg-background px-2 text-sm'
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder='Optional'
          maxLength={120}
          disabled={pending}
          autoComplete='off'
        />
      </label>
      <Button type='submit' size='sm' disabled={pending}>
        {pending ? 'Shipping…' : 'Confirm ship'}
      </Button>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        disabled={pending}
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>
    </form>
  )
}
