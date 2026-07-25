'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lookupSupportOrder } from '@/lib/actions/support.actions'

export default function SupportOrderLookup({
  initialEmail = '',
}: {
  initialEmail?: string
}) {
  const router = useRouter()
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [pendingId, startId] = useTransition()
  const [pendingEmail, startEmail] = useTransition()

  return (
    <div className='space-y-3'>
      <form
        className='flex flex-wrap gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          startId(async () => {
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
        <Button type='submit' disabled={pendingId || !orderId.trim()}>
          {pendingId ? 'Looking up…' : 'Open order'}
        </Button>
      </form>

      <form
        className='flex flex-wrap gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = email.trim()
          if (!trimmed) {
            toast.error('Email required')
            return
          }
          startEmail(() => {
            router.push(`/support?email=${encodeURIComponent(trimmed)}`)
          })
        }}
      >
        <Input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='Buyer email'
          className='max-w-md'
          aria-label='Buyer email'
        />
        <Button type='submit' disabled={pendingEmail || !email.trim()}>
          {pendingEmail ? 'Searching…' : 'Search by email'}
        </Button>
        {initialEmail ? (
          <Button
            type='button'
            variant='outline'
            disabled={pendingEmail}
            onClick={() => {
              setEmail('')
              router.push('/support')
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>
    </div>
  )
}
