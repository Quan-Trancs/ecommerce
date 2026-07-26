'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setBackInStockPreferences } from '@/lib/actions/account.actions'

export default function BackInStockPreferencesForm({
  notifyBackInStock,
}: {
  notifyBackInStock: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyBackInStock)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setBackInStockPreferences({
            notifyBackInStock: enabled,
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
        <p className='text-sm font-medium'>Back-in-stock alerts</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Email and in-app notice when a product you asked about returns to
          stock (requires RESEND_API_KEY for email).
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
          <span className='font-medium'>
            Notify me when subscribed items are back in stock
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save stock alert prefs'}
      </Button>
    </form>
  )
}
