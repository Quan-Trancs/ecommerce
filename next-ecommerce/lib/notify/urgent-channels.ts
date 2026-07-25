import { findUserById } from '@/lib/db/users'
import { roleLabel } from '@/lib/auth/roles'
import { SERVER_URL } from '@/lib/constants'
import { resolveOrderPartyAccounts } from '@/lib/notify/order-parties'
import { sendSms } from '@/lib/notify/sms'
import { sendWebPushToAccount } from '@/lib/notify/web-push'

function truncate(text: string, max: number) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

/**
 * SMS + web push for urgent PUBLIC order notes.
 * Bypasses email quiet hours. INTERNAL notes never notify.
 */
export async function notifyUrgentOrderNoteChannels(input: {
  orderId: string
  authorUserId: string
  authorRole: string
  authorDisplayName?: string | null
  body: string
}) {
  try {
    const author = await findUserById(input.authorUserId)
    const authorLabel =
      input.authorDisplayName?.trim() ||
      author?.name ||
      author?.email ||
      'Someone'
    const parties = await resolveOrderPartyAccounts({
      orderId: input.orderId,
      authorUserId: input.authorUserId,
    })
    const orderUrl = `${SERVER_URL}/account/orders/${input.orderId}`
    const smsBody = truncate(
      `Urgent order note from ${authorLabel} (${roleLabel(input.authorRole)}) on ${input.orderId}: ${input.body}\n${orderUrl}`,
      320
    )

    for (const account of parties) {
      if (account.notifyOrderNotesSms && account.phoneE164) {
        await sendSms({ to: account.phoneE164, body: smsBody })
      }
      if (account.notifyOrderNotesPush) {
        await sendWebPushToAccount(account.id, {
          title: 'Urgent order message',
          body: truncate(`${authorLabel}: ${input.body}`, 120),
          url: orderUrl,
        })
      }
    }
  } catch (err) {
    console.error('notifyUrgentOrderNoteChannels failed:', err)
  }
}
