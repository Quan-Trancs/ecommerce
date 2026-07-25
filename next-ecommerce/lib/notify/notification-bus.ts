import { EventEmitter } from 'events'
import {
  publishNotificationRedis,
  subscribeNotificationRedis,
} from '@/lib/notify/redis-pubsub'

/**
 * Notification wake bus for SSE clients.
 * Always emits in-process; when REDIS_URL / REDIS_HOST is set, also fans out
 * across instances via Redis pub/sub (poll fallback remains for resilience).
 */
const globalKey = '__orderNoteNotificationBus'
const redisBridgeKey = '__orderNoteNotificationRedisBridge'

type Bus = EventEmitter & {
  publish: (accountId: string) => void
  subscribe: (accountId: string, listener: () => void) => () => void
}

function createBus(): Bus {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(200)
  const bus = emitter as Bus
  bus.publish = (accountId: string) => {
    if (!accountId) return
    emitter.emit(`account:${accountId}`)
    emitter.emit('any')
    void publishNotificationRedis(accountId)
  }
  bus.subscribe = (accountId: string, listener: () => void) => {
    const event = `account:${accountId}`
    emitter.on(event, listener)
    ensureRedisBridge()
    return () => {
      emitter.off(event, listener)
    }
  }
  return bus
}

declare global {
  // eslint-disable-next-line no-var
  var __orderNoteNotificationBus: Bus | undefined
  // eslint-disable-next-line no-var
  var __orderNoteNotificationRedisBridge: boolean | undefined
}

export function getNotificationBus(): Bus {
  if (!global[globalKey]) {
    global[globalKey] = createBus()
  }
  return global[globalKey]!
}

function ensureRedisBridge() {
  if (global[redisBridgeKey]) return
  global[redisBridgeKey] = true
  const bus = getNotificationBus()
  void subscribeNotificationRedis((accountId) => {
    // Remote fan-in only — local publish already emitted.
    bus.emit(`account:${accountId}`)
    bus.emit('any')
  }).catch((error) => {
    global[redisBridgeKey] = false
    console.warn(
      'notification redis subscribe failed:',
      error instanceof Error ? error.message : error
    )
  })
}

export function publishInAppNotification(accountId: string) {
  getNotificationBus().publish(accountId)
}
