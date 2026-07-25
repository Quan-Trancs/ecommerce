'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  getNotificationPermission,
  isDesktopAlertsEnabled,
  setDesktopAlertsEnabled,
} from '@/lib/notify/desktop-notification'
import {
  areLiveToastsEnabled,
  setLiveToastsEnabled,
} from '@/lib/notify/live-toast-preference'

/**
 * Per-browser live alert controls (toasts + desktop while tab backgrounded).
 */
export default function DesktopAlertsPreference() {
  const [pending, startTransition] = useTransition()
  const [desktopEnabled, setDesktopEnabled] = useState(false)
  const [toastsEnabled, setToastsEnabled] = useState(true)
  const [permission, setPermission] = useState<
    NotificationPermission | 'unsupported'
  >('default')

  useEffect(() => {
    setDesktopEnabled(isDesktopAlertsEnabled())
    setToastsEnabled(areLiveToastsEnabled())
    setPermission(getNotificationPermission())
  }, [])

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div>
        <p className='text-sm font-medium'>Live alerts (this browser)</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Control toasts and OS notifications while you are signed in with a
          live connection.
        </p>
      </div>

      <label className='flex items-start gap-2 text-sm'>
        <input
          type='checkbox'
          className='mt-1'
          checked={toastsEnabled}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.checked
            setLiveToastsEnabled(next)
            setToastsEnabled(next)
            toast.success(next ? 'Live toasts on' : 'Live toasts muted')
          }}
        />
        <span>
          <span className='font-medium'>Show live toasts</span>
          <span className='mt-0.5 block text-muted-foreground'>
            Pop-up toast when a new message arrives while this tab is visible.
          </span>
        </span>
      </label>

      <label className='flex items-start gap-2 text-sm'>
        <input
          type='checkbox'
          className='mt-1'
          checked={desktopEnabled}
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
                  setDesktopEnabled(false)
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
              setDesktopEnabled(next)
              toast.success(next ? 'Desktop alerts on' : 'Desktop alerts off')
            })
          }}
        />
        <span>
          <span className='font-medium'>Desktop alerts while browsing</span>
          <span className='mt-0.5 block text-muted-foreground'>
            {permission === 'unsupported'
              ? 'Not supported in this browser.'
              : permission === 'denied'
                ? 'Blocked — allow notifications for this site in browser settings.'
                : permission === 'granted'
                  ? 'Permission granted. Fires when this tab is in the background.'
                  : 'Will ask for permission when enabled.'}
          </span>
        </span>
      </label>

      {desktopEnabled && permission === 'granted' ? (
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
