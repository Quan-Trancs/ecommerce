'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasSupportAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { getOrderById, partialRefundOrder } from '@/lib/actions/order.actions'
import {
  cancelReturnRequest,
  createReturnRequest,
  getReservedReturnQuantities,
  getReturnById,
  listOpenReturnRequests,
  listReturnsForOrder,
  reviewReturnRequest,
  type OrderReturnRequest,
  type ReturnReason,
} from '@/lib/db/order-returns'
import { RETURN_REASONS } from '@/lib/returns/constants'
import { logStaffAction } from '@/lib/audit/log-staff-action'
import { createStoreOrderNote } from '@/lib/catalog/client'

export type { OrderReturnRequest }
export { RETURN_REASONS } from '@/lib/returns/constants'

function reasonLabel(reason: string) {
  return (
    RETURN_REASONS.find((r) => r.value === reason)?.label || reason || 'Other'
  )
}

export async function getOrderReturnContext(orderId: string): Promise<{
  returns: OrderReturnRequest[]
  reservedByItemId: Record<string, number>
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { returns: [], reservedByItemId: {} }
  }
  const order = await getOrderById(orderId)
  if (!order) return { returns: [], reservedByItemId: {} }
  const orderUserId = typeof order.user === 'string' ? order.user : undefined
  const isOwner = orderUserId === session.user.id
  if (!isOwner && !hasSupportAccess(session.user.role)) {
    return { returns: [], reservedByItemId: {} }
  }
  const [returns, reserved] = await Promise.all([
    listReturnsForOrder(orderId),
    getReservedReturnQuantities(orderId),
  ])
  const reservedByItemId: Record<string, number> = {}
  for (const [itemId, qty] of reserved.entries()) {
    reservedByItemId[String(itemId)] = qty
  }
  return JSON.parse(
    JSON.stringify({
      returns,
      reservedByItemId,
    })
  )
}

export async function getSupportReturnQueue(): Promise<OrderReturnRequest[]> {
  const session = await auth()
  if (!hasSupportAccess(session?.user?.role)) return []
  const rows = await listOpenReturnRequests({ limit: 60 })
  return JSON.parse(JSON.stringify(rows))
}

export async function submitReturnRequest(input: {
  orderId: string
  reason: ReturnReason | string
  note?: string
  lines: Array<{ orderItemId: number; quantity: number }>
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const order = await getOrderById(input.orderId)
    if (!order) return { success: false, message: 'Order not found' }
    const orderUserId = typeof order.user === 'string' ? order.user : undefined
    if (orderUserId !== session.user.id) {
      return { success: false, message: 'Only the buyer can request a return' }
    }

    const status = String(order.status || '').toUpperCase()
    if (status === 'CANCELLED') {
      return { success: false, message: 'Cancelled orders cannot be returned' }
    }
    if (!order.isPaid) {
      return { success: false, message: 'Order must be paid before returning' }
    }

    const requested = (input.lines || []).filter((l) => l.quantity > 0)
    if (!requested.length) {
      return { success: false, message: 'Select quantities to return' }
    }

    const reserved = await getReservedReturnQuantities(input.orderId)
    const byId = new Map(
      (order.items || [])
        .filter((item) => item.id != null)
        .map((item) => [Number(item.id), item])
    )

    const lines: Array<{ orderItemId: number; quantity: number }> = []
    for (const line of requested) {
      const item = byId.get(line.orderItemId)
      if (!item) {
        return { success: false, message: `Item ${line.orderItemId} not found` }
      }
      if (!item.isShipped) {
        return {
          success: false,
          message: `Only shipped items can be returned (${item.name})`,
        }
      }
      const refunded = Number(item.refundedQuantity) || 0
      const reservedQty = reserved.get(line.orderItemId) || 0
      const available = Math.max(
        0,
        Number(item.quantity) - refunded - reservedQty
      )
      if (line.quantity > available) {
        return {
          success: false,
          message: `Quantity exceeds returnable units for ${item.name}`,
        }
      }
      lines.push({
        orderItemId: line.orderItemId,
        quantity: line.quantity,
      })
    }

    const reason = String(input.reason || 'OTHER').toUpperCase()
    const valid = RETURN_REASONS.some((r) => r.value === reason)
    await createReturnRequest({
      orderId: input.orderId,
      accountId: session.user.id,
      reason: valid ? reason : 'OTHER',
      note: input.note,
      lines,
    })

    revalidatePath(`/account/orders/${input.orderId}`)
    revalidatePath('/support/returns')
    return {
      success: true,
      message: 'Return request submitted — support will review it',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function cancelMyReturnRequest(
  returnId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in required' }
    }
    const existing = await getReturnById(returnId)
    if (!existing) return { success: false, message: 'Return not found' }
    const ok = await cancelReturnRequest({
      returnId,
      accountId: session.user.id,
    })
    if (!ok) {
      return {
        success: false,
        message: 'Only open requests can be cancelled',
      }
    }
    revalidatePath(`/account/orders/${existing.orderId}`)
    revalidatePath('/support/returns')
    return { success: true, message: 'Return request cancelled' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function reviewOrderReturn(input: {
  returnId: number
  decision: 'APPROVED' | 'REJECTED'
  reviewNote?: string
  processRefund?: boolean
}): Promise<{ success: boolean; message: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || !hasSupportAccess(session.user.role)) {
      return { success: false, message: 'Support or admin required' }
    }
    const decision =
      input.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    const existing = await getReturnById(input.returnId)
    if (!existing || existing.status !== 'REQUESTED') {
      return { success: false, message: 'Return is not awaiting review' }
    }

    let refundMeta: {
      amount?: number
      refundId?: string | null
      refundStatus?: string | null
      refundSkipped?: boolean
    } = {}

    if (decision === 'APPROVED' && input.processRefund !== false) {
      const lines = existing.items
        .filter((i) => i.quantity > 0)
        .map((i) => ({
          orderItemId: i.orderItemId,
          quantity: i.quantity,
        }))
      if (!lines.length) {
        return { success: false, message: 'Return has no line items' }
      }
      const refundResult = await partialRefundOrder(
        existing.orderId,
        lines,
        {
          allowShipped: true,
          skipStaffAudit: true,
          note: `Return #${existing.id} refund`,
        }
      )
      if (!refundResult.success) {
        return {
          success: false,
          message: `Refund failed — return left open: ${refundResult.message}`,
        }
      }
      refundMeta = {
        amount: 'amount' in refundResult ? refundResult.amount : undefined,
        refundId: 'refundId' in refundResult ? refundResult.refundId : null,
        refundStatus:
          'refundStatus' in refundResult ? refundResult.refundStatus : null,
        refundSkipped:
          'refundSkipped' in refundResult
            ? Boolean(refundResult.refundSkipped)
            : false,
      }
    }

    const updated = await reviewReturnRequest({
      returnId: input.returnId,
      reviewerId: session.user.id,
      status: decision,
      reviewNote: input.reviewNote,
      refundAmount: refundMeta.amount ?? null,
      refundId: refundMeta.refundId ?? null,
      refundStatus: refundMeta.refundStatus ?? null,
      refundSkipped:
        decision === 'APPROVED' && input.processRefund !== false
          ? Boolean(refundMeta.refundSkipped)
          : null,
    })
    if (!updated) {
      return {
        success: false,
        message:
          decision === 'APPROVED' && input.processRefund !== false
            ? 'Refund applied but return status update failed — check the order'
            : 'Return is not awaiting review',
      }
    }

    await logStaffAction({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: decision === 'APPROVED' ? 'RETURN_APPROVE' : 'RETURN_REJECT',
      entityType: 'order',
      entityId: updated.orderId,
      summary: `${decision === 'APPROVED' ? 'Approved' : 'Rejected'} return #${updated.id} on order ${updated.orderId}${
        refundMeta.amount != null
          ? ` (refund $${Number(refundMeta.amount).toFixed(2)})`
          : ''
      }`,
      metadata: {
        returnId: updated.id,
        reason: updated.reason,
        reviewNote: input.reviewNote || null,
        refundAmount: refundMeta.amount ?? null,
        refundId: refundMeta.refundId ?? null,
        refundSkipped: refundMeta.refundSkipped ?? null,
      },
    })

    try {
      const refundBit =
        decision === 'APPROVED' && refundMeta.amount != null
          ? ` Refund $${Number(refundMeta.amount).toFixed(2)}${
              refundMeta.refundId ? ` (${refundMeta.refundId})` : ''
            }${refundMeta.refundSkipped ? ' — processor skipped' : ''}.`
          : decision === 'APPROVED' && input.processRefund === false
            ? ' Approved without automatic refund.'
            : ''
      await createStoreOrderNote(
        updated.orderId,
        `Return #${updated.id} ${decision.toLowerCase()}: ${reasonLabel(updated.reason)}${
          input.reviewNote?.trim() ? ` — ${input.reviewNote.trim()}` : ''
        }.${refundBit}`,
        {
          userId: session.user.id,
          email: session.user.email,
          displayName: session.user.name,
          role: session.user.role,
        },
        { visibility: 'INTERNAL' }
      )
    } catch (noteError) {
      console.error('Failed to post return review note:', noteError)
    }

    revalidatePath(`/account/orders/${updated.orderId}`)
    revalidatePath('/support/returns')
    revalidatePath('/admin/audit')
    revalidatePath('/seller/earnings')
    return {
      success: true,
      message:
        decision === 'APPROVED'
          ? refundMeta.amount != null
            ? `Return approved and $${Number(refundMeta.amount).toFixed(2)} refunded`
            : 'Return approved'
          : 'Return rejected',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
