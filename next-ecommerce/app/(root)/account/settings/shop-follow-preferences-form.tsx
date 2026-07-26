'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setShopFollowPreferences } from '@/lib/actions/account.actions'

export default function ShopFollowPreferencesForm({
  notifyShopFollows,
}: {
  notifyShopFollows: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyShopFollows)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setShopFollowPreferences({
            notifyShopFollows: enabled,
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
        <p className='text-sm font-medium'>Followed shop alerts</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Email and in-app notice when a shop you follow publishes a new
          product or posts an announcement. Listing emails are batched into
          digests a few times a day (requires RESEND_API_KEY + cron).
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
            Notify me about shops I follow
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save shop follow prefs'}
      </Button>
    </form>
  )
}
