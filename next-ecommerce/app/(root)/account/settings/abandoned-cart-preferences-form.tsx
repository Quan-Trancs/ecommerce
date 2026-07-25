'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setAbandonedCartPreferences } from '@/lib/actions/account.actions'

export default function AbandonedCartPreferencesForm({
  notifyAbandonedCart,
}: {
  notifyAbandonedCart: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyAbandonedCart)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setAbandonedCartPreferences({
            notifyAbandonedCart: enabled,
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
      <div>
        <p className='text-sm font-medium'>Abandoned cart emails</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Reminder email if items sit in your signed-in cart for about a day
          (requires RESEND_API_KEY on the server).
        </p>
      </div>
      <label className='flex items-start gap-2 text-sm'>
        <input
          type='checkbox'
          className='mt-1'
          checked={enabled}
          disabled={pending}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>
          <span className='font-medium'>Email me about items left in my cart</span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save cart reminder prefs'}
      </Button>
    </form>
  )
}
