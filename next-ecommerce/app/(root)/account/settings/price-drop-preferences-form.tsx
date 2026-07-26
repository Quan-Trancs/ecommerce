'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setPriceDropPreferences } from '@/lib/actions/account.actions'

export default function PriceDropPreferencesForm({
  notifyPriceDrops,
}: {
  notifyPriceDrops: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyPriceDrops)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setPriceDropPreferences({
            notifyPriceDrops: enabled,
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
        <p className='text-sm font-medium'>Wishlist price drops</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Email and in-app notice when a saved product drops below the price
          when you wishlisted it (requires RESEND_API_KEY for email).
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
            Notify me about wishlist price drops
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save price-drop prefs'}
      </Button>
    </form>
  )
}
