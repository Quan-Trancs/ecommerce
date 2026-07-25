'use client'

import { useEffect, useRef, useState } from 'react'
import type { InAppNotification } from '@/lib/actions/notification.actions'

export type NotificationSummaryPayload = {
  unreadCount: number
  recent: InAppNotification[]
  latestId?: number | null
  reason?: string
}

/**
 * Subscribe to /api/notifications/stream (SSE) and keep local summary fresh.
 */
export function useNotificationStream(
  enabled: boolean,
  initial: NotificationSummaryPayload
) {
  const [summary, setSummary] = useState(initial)
  const [connected, setConnected] = useState(false)
  const initialRef = useRef(initial)

  useEffect(() => {
    initialRef.current = initial
    setSummary(initial)
  }, [initial])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let source: EventSource | null = null
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (cancelled) return
      source = new EventSource('/api/notifications/stream')

      source.addEventListener('open', () => {
        if (!cancelled) setConnected(true)
      })

      source.addEventListener('summary', (event) => {
        try {
          const data = JSON.parse(
            (event as MessageEvent).data
          ) as NotificationSummaryPayload
          setSummary({
            unreadCount: Number(data.unreadCount) || 0,
            recent: Array.isArray(data.recent) ? data.recent : [],
            latestId: data.latestId ?? null,
            reason: data.reason,
          })
        } catch {
          // ignore malformed payloads
        }
      })

      source.onerror = () => {
        setConnected(false)
        source?.close()
        source = null
        if (cancelled) return
        retryTimer = setTimeout(connect, 4000)
      }
    }

    connect()

    return () => {
      cancelled = true
      setConnected(false)
      if (retryTimer) clearTimeout(retryTimer)
      source?.close()
    }
  }, [enabled])

  return { summary, connected, setSummary }
}
