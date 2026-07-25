'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { setNotifyOrderNotes } from '@/lib/actions/account.actions'

export default function NotificationPreferencesForm({
  notifyOrderNotes,
}: {
  notifyOrderNotes: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.currentTarget
        const checked = (
          form.elements.namedItem('notifyOrderNotes') as HTMLInputElement
        ).checked
        startTransition(async () => {
          const result = await setNotifyOrderNotes(checked)
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
          name='notifyOrderNotes'
          defaultChecked={notifyOrderNotes}
          disabled={pending}
          className='mt-1'
        />
        <span>
          <span className='font-medium'>Order note emails</span>
          <span className='mt-1 block text-muted-foreground'>
            Email me about public messages on orders I buy or sell. Messages are
            batched into digests (about every 15 minutes) instead of one email
            per reply. Internal staff notes are never emailed.
          </span>
        </span>
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  )
}
