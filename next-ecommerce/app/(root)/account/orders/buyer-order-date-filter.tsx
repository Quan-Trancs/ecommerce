'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function BuyerOrderDateFilter({
  status,
  initialFrom = '',
  initialTo = '',
}: {
  status?: string
  initialFrom?: string
  initialTo?: string
}) {
  const router = useRouter()
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className='mb-6 flex flex-wrap items-end gap-2'
      onSubmit={(e) => {
        e.preventDefault()
        const params = new URLSearchParams()
        if (status) params.set('status', status)
        if (from.trim()) params.set('from', from.trim())
        if (to.trim()) params.set('to', to.trim())
        const q = params.toString()
        startTransition(() => {
          router.push(q ? `/account/orders?${q}` : '/account/orders')
        })
      }}
    >
      <div>
        <label
          htmlFor='order-from'
          className='mb-1 block text-xs font-medium text-muted-foreground'
        >
          From
        </label>
        <Input
          id='order-from'
          type='date'
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className='w-auto'
        />
      </div>
      <div>
        <label
          htmlFor='order-to'
          className='mb-1 block text-xs font-medium text-muted-foreground'
        >
          To
        </label>
        <Input
          id='order-to'
          type='date'
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className='w-auto'
        />
      </div>
      <Button type='submit' variant='outline' disabled={pending}>
        {pending ? 'Applying…' : 'Apply dates'}
      </Button>
    </form>
  )
}
