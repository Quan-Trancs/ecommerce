'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotification,
} from '@/lib/actions/notification.actions'
import { useNotificationStream } from '@/hooks/use-notification-stream'
import { cn, formatDateTime } from '@/lib/utils'

export default function NotificationsList({
  notifications,
}: {
  notifications: InAppNotification[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { summary } = useNotificationStream(true, {
    unreadCount: notifications.filter((n) => !n.readAt).length,
    recent: notifications.slice(0, 8),
  })

  useEffect(() => {
    if (summary.reason === 'publish') {
      router.refresh()
    }
  }, [summary.latestId, summary.unreadCount, summary.reason, router])

  const unread = notifications.filter((n) => !n.readAt).length

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          {unread ? `${unread} unread` : 'All caught up'} · live
        </p>
        {unread > 0 ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await markAllNotificationsRead()
                if (result.success) {
                  toast.success(result.message)
                  router.refresh()
                } else {
                  toast.error(result.message)
                }
              })
            }}
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No notifications yet. Public order-note messages will appear here.
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {notifications.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className={cn(
                  'w-full space-y-1 px-4 py-3 text-left hover:bg-muted/40',
                  !item.readAt && 'bg-muted/20'
                )}
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    if (!item.readAt) {
                      await markNotificationRead(item.id)
                    }
                    router.push(item.href)
                    router.refresh()
                  })
                }}
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-medium'>{item.title}</span>
                  {item.urgent ? (
                    <Badge variant='destructive'>Urgent</Badge>
                  ) : null}
                  {!item.readAt ? (
                    <Badge variant='secondary'>Unread</Badge>
                  ) : null}
                  <span className='text-xs text-muted-foreground'>
                    {formatDateTime(new Date(item.createdAt)).dateTime}
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>{item.body}</p>
                <p className='text-xs text-primary'>Open thread →</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className='text-xs text-muted-foreground'>
        Prefer email or SMS? Update{' '}
        <Link href='/account/settings' className='text-primary underline'>
          notification settings
        </Link>
        .
      </p>
    </div>
  )
}
