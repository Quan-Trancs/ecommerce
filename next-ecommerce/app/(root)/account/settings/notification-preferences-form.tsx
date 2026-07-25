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

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

async function enableBrowserPush(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push is not supported in this browser')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied')
  }
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }))
  const json = subscription.toJSON()
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  })
  if (!response.ok) {
    throw new Error('Could not save push subscription')
  }
}

export default function NotificationPreferencesForm({
  notifyOrderNotes,
  orderNoteEmailMode,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  quietHoursTimezone,
  phoneE164,
  notifyOrderNotesSms,
  notifyOrderNotesPush,
  notifyInAppOrderNotes,
  vapidPublicKey,
}: {
  notifyOrderNotes: boolean
  orderNoteEmailMode: OrderNoteEmailMode
  quietHoursEnabled: boolean
  quietHoursStart: number
  quietHoursEnd: number
  quietHoursTimezone: string
  phoneE164: string
  notifyOrderNotesSms: boolean
  notifyOrderNotesPush: boolean
  notifyInAppOrderNotes: boolean
  vapidPublicKey: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(notifyOrderNotes)
  const [inAppEnabled, setInAppEnabled] = useState(notifyInAppOrderNotes)
  const [mode, setMode] = useState<OrderNoteEmailMode>(orderNoteEmailMode)
  const [quietEnabled, setQuietEnabled] = useState(quietHoursEnabled)
  const [quietStart, setQuietStart] = useState(quietHoursStart)
  const [quietEnd, setQuietEnd] = useState(quietHoursEnd)
  const [timezone, setTimezone] = useState(
    quietHoursTimezone || browserTimezone()
  )
  const [phone, setPhone] = useState(phoneE164)
  const [smsEnabled, setSmsEnabled] = useState(notifyOrderNotesSms)
  const [pushEnabled, setPushEnabled] = useState(notifyOrderNotesPush)

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
          try {
            if (pushEnabled && vapidPublicKey) {
              await enableBrowserPush(vapidPublicKey)
            }
            const result = await setOrderNoteNotificationPreferences({
              notifyOrderNotes: enabled,
              orderNoteEmailMode: mode,
              quietHoursEnabled: quietEnabled,
              quietHoursStart: quietStart,
              quietHoursEnd: quietEnd,
              quietHoursTimezone: timezone,
              phoneE164: phone,
              notifyOrderNotesSms: smsEnabled,
              notifyOrderNotesPush: pushEnabled,
              notifyInAppOrderNotes: inAppEnabled,
            })
            if (result.success) {
              toast.success(result.message)
              router.refresh()
            } else {
              toast.error(result.message)
            }
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Could not save preferences'
            )
          }
        })
      }}
    >
      <label className='flex items-start gap-3 text-sm'>
        <input
          type='checkbox'
          checked={inAppEnabled}
          onChange={(e) => setInAppEnabled(e.target.checked)}
          disabled={pending}
          className='mt-1'
        />
        <span>
          <span className='font-medium'>In-app inbox for order notes</span>
          <span className='mt-1 block text-muted-foreground'>
            Add public order messages to your notification center. You can also
            mute a single order from its support thread.
          </span>
        </span>
      </label>

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
              if (next && !timezone) setTimezone(browserTimezone())
            }}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>Pause emails overnight</span>
            <span className='mt-0.5 block text-muted-foreground'>
              Queue email during quiet hours. Urgent SMS/push still deliver.
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

      <fieldset disabled={pending} className='space-y-3 border-t pt-4'>
        <legend className='text-sm font-medium'>Urgent channels</legend>
        <p className='text-xs text-muted-foreground'>
          Used when someone marks a public order note as urgent.
        </p>
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='checkbox'
            checked={smsEnabled}
            onChange={(e) => setSmsEnabled(e.target.checked)}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>SMS for urgent notes</span>
            <span className='mt-0.5 block text-muted-foreground'>
              Requires Twilio env vars on the server.
            </span>
          </span>
        </label>
        <label className='text-sm'>
          <span className='mb-1 block text-muted-foreground'>
            Mobile number (E.164)
          </span>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='+15551234567'
            disabled={!smsEnabled}
          />
        </label>
        <label className='flex items-start gap-2 text-sm'>
          <input
            type='checkbox'
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
            disabled={!vapidPublicKey}
            className='mt-1'
          />
          <span>
            <span className='font-medium'>Browser push for urgent notes</span>
            <span className='mt-0.5 block text-muted-foreground'>
              {vapidPublicKey
                ? 'Registers this browser when you save.'
                : 'Set NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY to enable.'}
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
