'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotification,
} from '@/lib/actions/notification.actions'
import { useNotificationStream } from '@/hooks/use-notification-stream'
import { showDesktopNotification } from '@/lib/notify/desktop-notification'
import { areLiveToastsEnabled } from '@/lib/notify/live-toast-preference'
import { cn, formatDateTime } from '@/lib/utils'

export default function NotificationsBell({
  unreadCount,
  recent,
}: {
  unreadCount: number
  recent: InAppNotification[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { summary, connected, setSummary } = useNotificationStream(true, {
    unreadCount,
    recent,
  })
  const lastSeenLatestId = useRef<number | null>(
    recent[0]?.id ?? null
  )

  useEffect(() => {
    const latest = summary.recent[0]
    if (!latest || latest.readAt) return
    if (summary.reason !== 'publish') return
    const previous = lastSeenLatestId.current
    if (previous != null && latest.id <= previous) return
    lastSeenLatestId.current = latest.id

    const showedDesktop = showDesktopNotification({
      id: latest.id,
      title: latest.title,
      body: latest.body,
      href: latest.href,
    })

    // In-tab toast when visible; OS notification covers backgrounded tabs.
    if (!showedDesktop && areLiveToastsEnabled()) {
      toast.message(latest.title, {
        description: latest.body.slice(0, 120),
        action: {
          label: 'Open',
          onClick: () => router.push(latest.href),
        },
      })
    }
  }, [summary, router])

  useEffect(() => {
    const id = recent[0]?.id
    if (id != null && (lastSeenLatestId.current == null || id > lastSeenLatestId.current)) {
      lastSeenLatestId.current = id
    }
  }, [recent])

  const count = summary.unreadCount
  const items = summary.recent

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='header-button relative flex items-center justify-center px-2'
          aria-label='Notifications'
          title={connected ? 'Live notifications' : 'Connecting…'}
        >
          <Bell className='size-5' />
          {connected ? (
            <span className='absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400' />
          ) : null}
          {count > 0 ? (
            <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-black'>
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-80' align='end' forceMount>
        <DropdownMenuLabel className='flex items-center justify-between gap-2'>
          <span>Notifications{connected ? ' · live' : ''}</span>
          {count > 0 ? (
            <button
              type='button'
              className='text-xs font-normal text-primary hover:underline disabled:opacity-50'
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await markAllNotificationsRead()
                  if (result.success) {
                    toast.success(result.message)
                    setSummary((prev) => ({
                      ...prev,
                      unreadCount: 0,
                      recent: prev.recent.map((item) => ({
                        ...item,
                        readAt: item.readAt || new Date().toISOString(),
                      })),
                    }))
                    router.refresh()
                  } else {
                    toast.error(result.message)
                  }
                })
              }}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className='px-2 py-6 text-center text-sm text-muted-foreground'>
            No notifications yet
          </div>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className='cursor-pointer items-start p-0'
              onSelect={(event) => {
                event.preventDefault()
                startTransition(async () => {
                  if (!item.readAt) {
                    await markNotificationRead(item.id)
                    setSummary((prev) => ({
                      ...prev,
                      unreadCount: Math.max(0, prev.unreadCount - 1),
                      recent: prev.recent.map((row) =>
                        row.id === item.id
                          ? { ...row, readAt: new Date().toISOString() }
                          : row
                      ),
                    }))
                  }
                  router.push(item.href)
                  router.refresh()
                })
              }}
            >
              <div
                className={cn(
                  'w-full space-y-1 px-2 py-2',
                  !item.readAt && 'bg-muted/40'
                )}
              >
                <div className='flex items-center gap-2'>
                  <p className='text-sm font-medium leading-none'>{item.title}</p>
                  {item.urgent ? (
                    <span className='rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive'>
                      Urgent
                    </span>
                  ) : null}
                </div>
                <p className='line-clamp-2 text-xs text-muted-foreground'>
                  {item.body}
                </p>
                <p className='text-[10px] text-muted-foreground'>
                  {formatDateTime(new Date(item.createdAt)).dateTime}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/account/notifications' className='w-full justify-center'>
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
