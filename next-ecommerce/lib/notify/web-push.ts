import webpush from 'web-push'
import {
  deletePushSubscriptionByEndpoint,
  listPushSubscriptionsForAccount,
} from '@/lib/db/push-subscriptions'

export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim()
  )
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject =
    process.env.VAPID_SUBJECT?.trim() || 'mailto:support@example.com'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function sendWebPushToAccount(
  accountId: string,
  payload: {
    title: string
    body: string
    url: string
  }
): Promise<{ sent: number }> {
  if (!configureWebPush()) return { sent: 0 }
  const subs = await listPushSubscriptionsForAccount(accountId)
  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
      sent += 1
    } catch (error: unknown) {
      const status =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0
      if (status === 404 || status === 410) {
        await deletePushSubscriptionByEndpoint(sub.endpoint)
      } else {
        console.warn('Web push failed for', accountId, error)
      }
    }
  }
  return { sent }
}
