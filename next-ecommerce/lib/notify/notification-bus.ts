import { EventEmitter } from 'events'

/**
 * In-process bus so SSE clients wake when a notification is inserted.
 * Multi-instance deploys still refresh via SSE polling fallback.
 */
const globalKey = '__orderNoteNotificationBus'

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
  }
  bus.subscribe = (accountId: string, listener: () => void) => {
    const event = `account:${accountId}`
    emitter.on(event, listener)
    return () => {
      emitter.off(event, listener)
    }
  }
  return bus
}

declare global {
  // eslint-disable-next-line no-var
  var __orderNoteNotificationBus: Bus | undefined
}

export function getNotificationBus(): Bus {
  if (!global[globalKey]) {
    global[globalKey] = createBus()
  }
  return global[globalKey]!
}

export function publishInAppNotification(accountId: string) {
  getNotificationBus().publish(accountId)
}
