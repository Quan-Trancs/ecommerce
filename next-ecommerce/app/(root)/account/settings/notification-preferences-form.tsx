'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setOrderNoteNotificationPreferences } from '@/lib/actions/account.actions'
import type { OrderNoteEmailMode } from '@/lib/db/users'

export default function NotificationPreferencesForm({
  notifyOrderNotes,
  orderNoteEmailMode,
}: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyOrderNotes)
  const [mode, setMode] = useState<OrderNoteEmailMode>(orderNoteEmailMode)

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setOrderNoteNotificationPreferences({
            notifyOrderNotes: enabled,
            orderNoteEmailMode: mode,
          })
          if (result.success) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      <label className='flex items-start gap-3 text-sm'>
        <input
          type='checkbox'
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={pending}
          className='mt-1'
        />
        <span>
          <span className='font-medium'>Order note emails</span>
          <span className='mt-1 block text-muted-foreground'>
            Email me about public messages on orders I buy or sell. Internal
            staff notes are never emailed.
          </span>
        </span>
      </label>

      <fieldset disabled={!enabled || pending} className='space-y-2 pl-7'>
        <legend className='text-sm font-medium'>Delivery</legend>
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='radio'
            name='orderNoteEmailMode'
            value='DIGEST'
            checked={mode === 'DIGEST'}
            onChange={() => setMode('DIGEST')}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>Digest</span>
            <span className='mt-0.5 block text-muted-foreground'>
              Batch messages (about every 15 minutes) into one email.
            </span>
          </span>
        </label>
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='radio'
            name='orderNoteEmailMode'
            value='IMMEDIATE'
            checked={mode === 'IMMEDIATE'}
            onChange={() => setMode('IMMEDIATE')}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>Immediate</span>
            <span className='mt-0.5 block text-muted-foreground'>
              Send an email for each public message as it arrives.
            </span>
          </span>
        </label>
      </fieldset>

      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  )
}
