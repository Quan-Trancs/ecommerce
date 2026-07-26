'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setReviewRequestPreferences } from '@/lib/actions/account.actions'

export default function ReviewRequestPreferencesForm({
  notifyReviewRequests,
}: {
  notifyReviewRequests: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyReviewRequests)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setReviewRequestPreferences({
            notifyReviewRequests: enabled,
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
        <p className='text-sm font-medium'>Review request emails</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          After an order ships, we may email you once to review products you
          have not rated yet (default ~7 days; requires RESEND_API_KEY + cron).
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
            Email me review reminders for shipped orders
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save review email prefs'}
      </Button>
    </form>
  )
}
