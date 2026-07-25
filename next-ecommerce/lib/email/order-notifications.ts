import { findUserById } from '@/lib/db/users'
import type { OrderNoteEmailMode } from '@/lib/db/users'
import {
  fetchProductsByIds,
  fetchStoreOrderAsAdmin,
  type StoreOrder,
} from '@/lib/catalog/client'
import type { IOrder } from '@/lib/types/order'
import {
  sendOrderNoteDigestEmail,
  sendOrderNoteEmail,
  sendOrderShippedEmail,
  sendPurchaseReceipt,
} from '@/emails/index'
import { SERVER_URL } from '@/lib/constants'
import { roleLabel } from '@/lib/auth/roles'
import {
  enqueueOrderNoteEmail,
  getDigestMaxBatch,
  getDigestWindowMinutes,
  isImmediateOrderNoteEmail,
  listPendingOrderNoteEmails,
  markOrderNoteEmailsSent,
  type QueuedOrderNoteEmail,
} from '@/lib/db/order-note-email-queue'

function storeOrderToEmailOrder(
  order: StoreOrder,
  user: { email: string; name?: string }
): IOrder {
  return {
    _id: order.id,
    user: { email: user.email, name: user.name || user.email },
    status: order.status,
    items: (order.items || []).map((item, index) => ({
      product: item.productId,
      clientId: `${item.productId}-${index}`,
      name: item.name,
      slug: item.slug || item.productId,
      image: item.image || '/images/placeholder.png',
      category: 'General',
      price: Number(item.price),
      countInStock: item.quantity,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    shippingAddress: {
      fullName: order.shipping?.fullName || '',
      street: order.shipping?.address || '',
      city: order.shipping?.city || '',
      postalCode: order.shipping?.postalCode || '',
      country: order.shipping?.country || '',
      province: '',
      phone: order.shipping?.phone || '',
    },
    expectedDeliveryDate: new Date(),
    paymentMethod: order.paymentMethod,
    paymentResult: undefined,
    itemsPrice: Number(order.itemsPrice),
    shippingPrice: Number(order.shippingPrice),
    taxPrice: Number(order.taxPrice),
    totalPrice: Number(order.totalPrice),
    isPaid: Boolean(order.isPaid),
    paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
    isDelivered: String(order.status || '').toUpperCase() === 'SHIPPED',
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: new Date(),
  }
}

async function orderForEmail(orderId: string): Promise<IOrder | null> {
  const storeOrder = await fetchStoreOrderAsAdmin(orderId)
  if (!storeOrder?.userId) return null
  const account = await findUserById(storeOrder.userId)
  if (!account?.email) {
    console.warn('No buyer email for order', orderId, storeOrder.userId)
    return null
  }
  return storeOrderToEmailOrder(storeOrder, {
    email: account.email,
    name: account.name,
  })
}

/** Fire-and-forget safe: never throws to callers. */
export async function notifyOrderPaid(orderId: string) {
  try {
    const order = await orderForEmail(orderId)
    if (!order) return
    await sendPurchaseReceipt({ order })
  } catch (err) {
    console.error('notifyOrderPaid failed:', err)
  }
}

export async function notifyOrderShipped(orderId: string) {
  try {
    const order = await orderForEmail(orderId)
    if (!order) return
    await sendOrderShippedEmail({ order })
  } catch (err) {
    console.error('notifyOrderShipped failed:', err)
  }
}

type NoteRecipient = {
  email: string
  mode: OrderNoteEmailMode
}

async function resolvePublicNoteRecipients(input: {
  orderId: string
  authorUserId: string
}): Promise<{
  recipients: NoteRecipient[]
  bodyAuthor: Awaited<ReturnType<typeof findUserById>>
} | null> {
  const storeOrder = await fetchStoreOrderAsAdmin(input.orderId)
  if (!storeOrder) return null

  const recipientIds = new Set<string>()
  if (storeOrder.userId) {
    recipientIds.add(storeOrder.userId)
  }

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
      if (product.sellerAccountId) {
        recipientIds.add(product.sellerAccountId)
      }
    }
  }

  recipientIds.delete(input.authorUserId)

  const byEmail = new Map<string, OrderNoteEmailMode>()
  for (const userId of recipientIds) {
    const account = await findUserById(userId)
    if (!account?.email) continue
    if (!account.notifyOrderNotes) continue
    const email = account.email.trim().toLowerCase()
    byEmail.set(email, account.orderNoteEmailMode)
  }

  const supportInbox = process.env.SUPPORT_ORDER_NOTES_EMAIL?.trim()
  if (supportInbox) {
    const email = supportInbox.toLowerCase()
    if (!byEmail.has(email)) {
      byEmail.set(email, 'DIGEST')
    }
  }

  const author = await findUserById(input.authorUserId)
  if (author?.email) {
    byEmail.delete(author.email.trim().toLowerCase())
  }

  return {
    recipients: [...byEmail.entries()].map(([email, mode]) => ({
      email,
      mode,
    })),
    bodyAuthor: author,
  }
}

function groupPendingByRecipient(rows: QueuedOrderNoteEmail[]) {
  const map = new Map<string, QueuedOrderNoteEmail[]>()
  for (const row of rows) {
    const list = map.get(row.recipientEmail) || []
    list.push(row)
    map.set(row.recipientEmail, list)
  }
  return map
}

function shouldFlushRecipient(
  rows: QueuedOrderNoteEmail[],
  forceAll: boolean
): boolean {
  if (!rows.length) return false
  if (forceAll) return true
  if (rows.length >= getDigestMaxBatch()) return true
  const windowMs = getDigestWindowMinutes() * 60_000
  if (windowMs <= 0) return true
  const oldest = rows[0].createdAt.getTime()
  return Date.now() - oldest >= windowMs
}

async function sendDigestForRows(
  to: string,
  rows: QueuedOrderNoteEmail[]
): Promise<boolean> {
  const notes = rows.map((row) => ({
    orderId: row.orderId,
    authorLabel: row.authorLabel,
    authorRoleLabel: row.authorRoleLabel,
    body: row.body,
    createdAtLabel: new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(row.createdAt),
    orderUrl: `${SERVER_URL}/account/orders/${row.orderId}`,
  }))

  const result = await sendOrderNoteDigestEmail({ to, notes })
  if (!result.sent) return false
  await markOrderNoteEmailsSent(rows.map((r) => r.id))
  return true
}

/**
 * Send queued digests that are due (age/batch) or all pending when forceAll.
 */
export async function flushOrderNoteDigests(
  options?: { forceAll?: boolean }
): Promise<{ recipients: number; messages: number }> {
  const forceAll = Boolean(options?.forceAll)
  const pending = await listPendingOrderNoteEmails()
  const byRecipient = groupPendingByRecipient(pending)
  let recipients = 0
  let messages = 0

  for (const [to, rows] of byRecipient) {
    if (!shouldFlushRecipient(rows, forceAll)) continue
    const sent = await sendDigestForRows(to, rows)
    if (!sent) continue
    recipients += 1
    messages += rows.length
  }

  return { recipients, messages }
}

/** Force-flush queued digests for one email (e.g. user switched to immediate). */
export async function flushOrderNoteDigestsForEmail(
  email: string
): Promise<{ messages: number }> {
  try {
    const normalized = email.trim().toLowerCase()
    if (!normalized) return { messages: 0 }
    const pending = await listPendingOrderNoteEmails()
    const rows = pending.filter((row) => row.recipientEmail === normalized)
    if (!rows.length) return { messages: 0 }
    const sent = await sendDigestForRows(normalized, rows)
    return { messages: sent ? rows.length : 0 }
  } catch (err) {
    console.error('flushOrderNoteDigestsForEmail failed:', err)
    return { messages: 0 }
  }
}

/**
 * Email the buyer and product-scoped sellers when a PUBLIC order note is posted.
 * Skips the author. INTERNAL notes never notify.
 * Per-user mode: DIGEST (queue) or IMMEDIATE (send now).
 * Global ORDER_NOTE_DIGEST_MINUTES=0 forces immediate for everyone.
 */
export async function notifyPublicOrderNote(input: {
  orderId: string
  authorUserId: string
  authorRole: string
  authorDisplayName?: string | null
  body: string
}) {
  try {
    const resolved = await resolvePublicNoteRecipients(input)
    if (!resolved || !resolved.recipients.length) return

    const author = resolved.bodyAuthor
    const authorLabel =
      input.authorDisplayName?.trim() ||
      author?.name ||
      author?.email ||
      'Someone'
    const authorRoleLabel = roleLabel(input.authorRole)
    const orderUrl = `${SERVER_URL}/account/orders/${input.orderId}`
    const forceImmediate = isImmediateOrderNoteEmail()

    const immediate: string[] = []
    const digest: string[] = []
    for (const recipient of resolved.recipients) {
      if (forceImmediate || recipient.mode === 'IMMEDIATE') {
        immediate.push(recipient.email)
      } else {
        digest.push(recipient.email)
      }
    }

    if (immediate.length) {
      await Promise.all(
        immediate.map((to) =>
          sendOrderNoteEmail({
            to,
            orderId: input.orderId,
            authorLabel,
            authorRoleLabel,
            body: input.body,
            orderUrl,
          })
        )
      )
    }

    for (const to of digest) {
      await enqueueOrderNoteEmail({
        recipientEmail: to,
        orderId: input.orderId,
        authorLabel,
        authorRoleLabel,
        body: input.body,
      })
    }

    if (digest.length) {
      await flushOrderNoteDigests({ forceAll: false })
    }
  } catch (err) {
    console.error('notifyPublicOrderNote failed:', err)
  }
}
