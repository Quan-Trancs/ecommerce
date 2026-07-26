'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setQaDigestPreferences } from '@/lib/actions/account.actions'

export default function QaDigestPreferencesForm({
  notifyQaDigest,
}: {
  notifyQaDigest: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyQaDigest)

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setQaDigestPreferences({
            notifyQaDigest: enabled,
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
        <p className='text-sm font-medium'>Product Q&amp;A digests</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Periodic email if unanswered questions sit on your seller listings
          (requires RESEND_API_KEY; default every 24 hours).
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
            Email me a digest of unanswered product questions
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save Q&A digest prefs'}
      </Button>
    </form>
  )
}
