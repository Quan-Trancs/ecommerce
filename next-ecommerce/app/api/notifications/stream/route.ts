import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import {
  countUnreadInAppNotifications,
  listInAppNotifications,
} from '@/lib/db/in-app-notifications'
import { getNotificationBus } from '@/lib/notify/notification-bus'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function buildPayload(accountId: string) {
  const [unreadCount, recent] = await Promise.all([
    countUnreadInAppNotifications(accountId),
    listInAppNotifications(accountId, { limit: 8 }),
  ])
  return {
    unreadCount,
    recent,
    latestId: recent[0]?.id ?? null,
    at: new Date().toISOString(),
  }
}

/**
 * Server-Sent Events stream for in-app notification badge/list refresh.
 * Emits `summary` JSON when unread state changes (pub/sub or poll).
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }
  const accountId = session.user.id
  const encoder = new TextEncoder()
  let closed = false
  let lastFingerprint = ''
  let unsubscribe: (() => void) | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      const pushSummary = async (reason: string) => {
        if (closed) return
        try {
          const payload = await buildPayload(accountId)
          const fingerprint = `${payload.unreadCount}:${payload.latestId}:${payload.recent.map((r) => r.readAt || 'u').join(',')}`
          if (fingerprint === lastFingerprint && reason !== 'hello') return
          lastFingerprint = fingerprint
          send('summary', { ...payload, reason })
        } catch (error) {
          console.error('notification SSE summary failed:', error)
          send('error', { message: 'summary_failed' })
        }
      }

      send('hello', { ok: true, accountId })
      void pushSummary('hello')

      unsubscribe = getNotificationBus().subscribe(accountId, () => {
        void pushSummary('publish')
      })

      pollTimer = setInterval(() => {
        void pushSummary('poll')
      }, 12_000)

      heartbeatTimer = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`))
      }, 20_000)

      request.signal.addEventListener('abort', () => {
        closed = true
        unsubscribe?.()
        if (pollTimer) clearInterval(pollTimer)
        if (heartbeatTimer) clearInterval(heartbeatTimer)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
    cancel() {
      closed = true
      unsubscribe?.()
      if (pollTimer) clearInterval(pollTimer)
      if (heartbeatTimer) clearInterval(heartbeatTimer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
