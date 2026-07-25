'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  getNotificationPermission,
  isDesktopAlertsEnabled,
  setDesktopAlertsEnabled,
} from '@/lib/notify/desktop-notification'

/**
 * Per-browser opt-in for OS notifications while the storefront tab is open
 * but backgrounded (complements SSE live updates).
 */
export default function DesktopAlertsPreference() {
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default')

  useEffect(() => {
    setEnabled(isDesktopAlertsEnabled())
    setPermission(getNotificationPermission())
  }, [])

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div>
        <p className='text-sm font-medium'>Desktop alerts (this browser)</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          When this tab is open in the background, show an OS notification for
          new in-app messages. Does not require VAPID push setup.
        </p>
      </div>

      <label className='flex items-start gap-2 text-sm'>
        <input
          type='checkbox'
          className='mt-1'
          checked={enabled}
          disabled={pending || permission === 'unsupported'}
          onChange={(e) => {
            const next = e.target.checked
            startTransition(async () => {
              if (next) {
                if (!('Notification' in window)) {
                  toast.error('Notifications are not supported here')
                  return
                }
                let nextPermission = Notification.permission
                if (nextPermission === 'default') {
                  nextPermission = await Notification.requestPermission()
                }
                setPermission(nextPermission)
                if (nextPermission !== 'granted') {
                  setEnabled(false)
                  setDesktopAlertsEnabled(false)
                  toast.error(
                    nextPermission === 'denied'
                      ? 'Notification permission denied in browser settings'
                      : 'Permission required for desktop alerts'
                  )
                  return
                }
              }
              setDesktopAlertsEnabled(next)
              setEnabled(next)
              toast.success(next ? 'Desktop alerts on' : 'Desktop alerts off')
            })
          }}
        />
        <span>
          <span className='font-medium'>Alert me while browsing</span>
          <span className='mt-0.5 block text-muted-foreground'>
            {permission === 'unsupported'
              ? 'Not supported in this browser.'
              : permission === 'denied'
                ? 'Blocked — allow notifications for this site in browser settings.'
                : permission === 'granted'
                  ? 'Permission granted.'
                  : 'Will ask for permission when enabled.'}
          </span>
        </span>
      </label>

      {enabled && permission === 'granted' ? (
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={pending}
          onClick={() => {
            new Notification('Desktop alerts ready', {
              body: 'You will see alerts when this tab is in the background.',
              tag: 'desktop-alerts-test',
            })
          }}
        >
          Send test notification
        </Button>
      ) : null}
    </div>
  )
}
