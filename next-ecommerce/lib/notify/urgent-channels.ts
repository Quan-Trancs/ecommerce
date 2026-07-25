import { findUserById, type DbUser } from '@/lib/db/users'
import {
  fetchProductsByIds,
  fetchStoreOrderAsAdmin,
} from '@/lib/catalog/client'
import { SERVER_URL } from '@/lib/constants'
import { roleLabel } from '@/lib/auth/roles'
import { sendSms } from '@/lib/notify/sms'
import { sendWebPushToAccount } from '@/lib/notify/web-push'

function truncate(text: string, max: number) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

async function resolvePartyAccounts(input: {
  orderId: string
  authorUserId: string
}): Promise<DbUser[]> {
  const storeOrder = await fetchStoreOrderAsAdmin(input.orderId)
  if (!storeOrder) return []

  const ids = new Set<string>()
  if (storeOrder.userId) ids.add(storeOrder.userId)

  const productIds = [
    ...new Set(
      (storeOrder.items || [])
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  if (productIds.length) {
    const products = await fetchProductsByIds(productIds)
    for (const product of products) {
      if (product.sellerAccountId) ids.add(product.sellerAccountId)
    }
  }
  ids.delete(input.authorUserId)

  const accounts: DbUser[] = []
  for (const id of ids) {
    const account = await findUserById(id)
    if (account) accounts.push(account)
  }
  return accounts
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
    const parties = await resolvePartyAccounts(input)
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
