'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setOrderNoteNotificationPreferences } from '@/lib/actions/account.actions'
import type { OrderNoteEmailMode } from '@/lib/db/users'
import { formatHourLabel } from '@/lib/email/quiet-hours'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export default function NotificationPreferencesForm({
  notifyOrderNotes,
  orderNoteEmailMode,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  quietHoursTimezone,
}: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  quietHoursTimezone: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyOrderNotes)
  const [mode, setMode] = useState<OrderNoteEmailMode>(orderNoteEmailMode)
  const [quietEnabled, setQuietEnabled] = useState(quietHoursEnabled)
  const [quietStart, setQuietStart] = useState(quietHoursStart)
  const [quietEnd, setQuietEnd] = useState(quietHoursEnd)
  const [timezone, setTimezone] = useState(
    quietHoursTimezone || browserTimezone()
  )

  const hourOptions = useMemo(
    () =>
      HOURS.map((hour) => (
        <option key={hour} value={hour}>
          {formatHourLabel(hour)} ({String(hour).padStart(2, '0')}:00)
        </option>
      )),
    []
  )

  return (
    <form
      className='space-y-4'
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await setOrderNoteNotificationPreferences({
            notifyOrderNotes: enabled,
            orderNoteEmailMode: mode,
            quietHoursEnabled: quietEnabled,
            quietHoursStart: quietStart,
            quietHoursEnd: quietEnd,
            quietHoursTimezone: timezone,
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

      <fieldset disabled={!enabled || pending} className='space-y-3 pl-7'>
        <legend className='text-sm font-medium'>Quiet hours</legend>
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='checkbox'
            checked={quietEnabled}
            onChange={(e) => {
              const next = e.target.checked
              setQuietEnabled(next)
              if (next && !timezone) {
                setTimezone(browserTimezone())
              }
            }}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>Pause emails overnight</span>
            <span className='mt-0.5 block text-muted-foreground'>
              Queue messages during quiet hours and deliver afterward (works
              for both digest and immediate).
            </span>
          </span>
        </label>

        {quietEnabled ? (
          <div className='grid gap-3 sm:grid-cols-2'>
            <label className='text-sm'>
              <span className='mb-1 block text-muted-foreground'>Starts</span>
              <select
                className='border-input bg-transparent h-9 w-full rounded-md border px-2 text-sm'
                value={quietStart}
                onChange={(e) => setQuietStart(Number(e.target.value))}
              >
                {hourOptions}
              </select>
            </label>
            <label className='text-sm'>
              <span className='mb-1 block text-muted-foreground'>Ends</span>
              <select
                className='border-input bg-transparent h-9 w-full rounded-md border px-2 text-sm'
                value={quietEnd}
                onChange={(e) => setQuietEnd(Number(e.target.value))}
              >
                {hourOptions}
              </select>
            </label>
            <label className='text-sm sm:col-span-2'>
              <span className='mb-1 block text-muted-foreground'>
                Timezone (IANA)
              </span>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder='America/Los_Angeles'
              />
              <button
                type='button'
                className='mt-1 text-xs text-primary hover:underline'
                onClick={() => setTimezone(browserTimezone())}
              >
                Use browser timezone ({browserTimezone()})
              </button>
            </label>
          </div>
        ) : null}
      </fieldset>

      <Button type='submit' disabled={pending}>
        {pending ? 'Saving…' : 'Save preferences'}
      </Button>
    </form>
  )
}
