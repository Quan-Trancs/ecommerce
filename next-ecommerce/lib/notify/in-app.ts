import { findUserById } from '@/lib/db/users'
import { createInAppNotification } from '@/lib/db/in-app-notifications'
import { listMutedOrderIdsForAccounts } from '@/lib/db/order-in-app-mutes'
import { roleLabel } from '@/lib/auth/roles'
import { resolveOrderPartyAccounts } from '@/lib/notify/order-parties'

function truncate(text: string, max: number) {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

/**
 * Create in-app inbox rows for parties on a PUBLIC order note.
 * Honors global notify_in_app_order_notes and per-order mutes.
 */
export async function notifyInAppOrderNote(input: {
  orderId: string
  noteId?: number | null
  authorUserId: string
  authorRole: string
  authorDisplayName?: string | null
  body: string
  urgent?: boolean
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
    const muted = await listMutedOrderIdsForAccounts(
      parties.map((p) => p.id),
      input.orderId
    )
    const recipients = parties.filter(
      (account) =>
        account.notifyInAppOrderNotes !== false && !muted.has(account.id)
    )
    if (recipients.length === 0) return

    const title = input.urgent
      ? 'Urgent order message'
      : 'New order message'
    const body = truncate(
      `${authorLabel} (${roleLabel(input.authorRole)}): ${input.body}`,
      280
    )
    const href = `/account/orders/${input.orderId}`

    await Promise.all(
      recipients.map((account) =>
        createInAppNotification({
          accountId: account.id,
          type: 'ORDER_NOTE',
          title,
          body,
          href,
          orderId: input.orderId,
          noteId: input.noteId ?? null,
          urgent: Boolean(input.urgent),
        })
      )
    )
  } catch (err) {
    console.error('notifyInAppOrderNote failed:', err)
  }
}
