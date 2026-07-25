import { createClient, type RedisClientType } from 'redis'

const CHANNEL = 'ecommerce:in-app-notifications'

type RedisClients = {
  publisher: RedisClientType
  subscriber: RedisClientType
}

declare global {
  // eslint-disable-next-line no-var
  var __notificationRedisClients: RedisClients | undefined
  // eslint-disable-next-line no-var
  var __notificationRedisInit: Promise<RedisClients | null> | undefined
}

function redisUrl(): string | null {
  const explicit = process.env.REDIS_URL?.trim()
  if (explicit) return explicit

  const host = process.env.REDIS_HOST?.trim()
  if (!host) return null
  const port = process.env.REDIS_PORT?.trim() || '6379'
  const password = process.env.REDIS_PASSWORD?.trim()
  if (password) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`
  }
  return `redis://${host}:${port}`
}

async function connectClients(): Promise<RedisClients | null> {
  const url = redisUrl()
  if (!url) return null

  try {
    const publisher = createClient({ url }) as RedisClientType
    const subscriber = publisher.duplicate()

    publisher.on('error', (err) => {
      console.error('notification redis publisher error:', err)
    })
    subscriber.on('error', (err) => {
      console.error('notification redis subscriber error:', err)
    })

    await Promise.all([publisher.connect(), subscriber.connect()])
    return { publisher, subscriber }
  } catch (error) {
    console.warn(
      'notification redis unavailable; using in-process bus only:',
      error instanceof Error ? error.message : error
    )
    return null
  }
}

export async function getNotificationRedis(): Promise<RedisClients | null> {
  if (global.__notificationRedisClients) {
    return global.__notificationRedisClients
  }
  if (!global.__notificationRedisInit) {
    global.__notificationRedisInit = connectClients().then((clients) => {
      if (clients) global.__notificationRedisClients = clients
      return clients
    })
  }
  return global.__notificationRedisInit
}

export function notificationRedisChannel() {
  return CHANNEL
}

export async function publishNotificationRedis(accountId: string): Promise<boolean> {
  if (!accountId) return false
  const clients = await getNotificationRedis()
  if (!clients) return false
  try {
    await clients.publisher.publish(CHANNEL, accountId)
    return true
  } catch (error) {
    console.error('notification redis publish failed:', error)
    return false
  }
}

export async function subscribeNotificationRedis(
  onMessage: (accountId: string) => void
): Promise<() => void> {
  const clients = await getNotificationRedis()
  if (!clients) return () => undefined

  const handler = (message: string) => {
    const accountId = String(message || '').trim()
    if (accountId) onMessage(accountId)
  }

  await clients.subscriber.subscribe(CHANNEL, handler)

  return () => {
    void clients.subscriber.unsubscribe(CHANNEL).catch(() => undefined)
  }
}
