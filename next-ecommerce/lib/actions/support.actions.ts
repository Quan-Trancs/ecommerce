'use server'

import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import {
  storeAuthHeaders,
  type StoreTokenSubject,
} from '@/lib/auth/store-token'
import { hasSupportAccess } from '@/lib/auth/roles'
import { formatError } from '@/lib/utils'
import { getOrderById } from '@/lib/actions/order.actions'
import type { IOrder } from '@/lib/types/order'
import {
  listSupportTickets,
  type SupportTicketFilters,
  type SupportTicketRow,
} from '@/lib/db/support-tickets'
import {
  clearTicketAssignment,
  listSupportStaff,
  upsertTicketAssignment,
  type SupportStaffOption,
} from '@/lib/db/support-ticket-assignments'
import { logStaffAction } from '@/lib/audit/log-staff-action'

export type { SupportTicketRow, SupportStaffOption }

const DEFAULT_API_URL = 'http://localhost:8082/api'

function getStoreApiUrl() {
  return (
    process.env.CATALOG_API_URL?.replace(/\/$/, '') ||
    process.env.STORE_API_URL?.replace(/\/$/, '') ||
    DEFAULT_API_URL
  )
}

async function requireSupportSession() {
  const session = await auth()
  const userId = session?.user?.id
  if (!session?.user || !userId) throw new Error('User not authenticated')
  if (!hasSupportAccess(session.user.role)) {
    throw new Error('Support role required')
  }
  return { session, userId }
}

async function requireSupportSubject(): Promise<StoreTokenSubject> {
  const { session, userId } = await requireSupportSession()
  return {
    userId,
    email: session.user.email,
    displayName: session.user.name,
    role: session.user.role,
  }
}

export type SupportOrderRow = {
  id: string
  userId: string
  status?: string
  isPaid?: boolean
  totalPrice: number
  createdAt?: string
  itemsCount: number
}

function mapSupportOrders(
  orders: Array<{
    id: string
    userId: string
    status?: string
    isPaid?: boolean
    totalPrice: number
    createdAt?: string
    items?: unknown[]
  }>
): SupportOrderRow[] {
  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    isPaid: o.isPaid,
    totalPrice: Number(o.totalPrice),
    createdAt: o.createdAt,
    itemsCount: o.items?.length ?? 0,
  }))
}

async function supportFetch(path: string): Promise<SupportOrderRow[]> {
  const subject = await requireSupportSubject()
  const authHeaders = await storeAuthHeaders(subject)
  if (!authHeaders.Authorization) {
    throw new Error('Unable to mint store API token')
  }
  const res = await fetch(`${getStoreApiUrl()}${path}`, {
    headers: { Accept: 'application/json', ...authHeaders },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Support API ${res.status}: ${text || res.statusText}`)
  }
  const orders = (await res.json()) as Array<{
    id: string
    userId: string
    status?: string
    isPaid?: boolean
    totalPrice: number
    createdAt?: string
    items?: unknown[]
  }>
  return mapSupportOrders(orders)
}

export async function listSupportRecentOrders(
  limit = 40
): Promise<SupportOrderRow[]> {
  const capped = Math.max(1, Math.min(limit, 100))
  return supportFetch(`/v1/orders/assist/recent?limit=${capped}`)
}

export async function listSupportOrdersByEmail(
  email: string
): Promise<SupportOrderRow[]> {
  const trimmed = email.trim()
  if (!trimmed) throw new Error('Email required')
  return supportFetch(
    `/v1/orders/assist/by-email?email=${encodeURIComponent(trimmed)}`
  )
}

export async function lookupSupportOrder(
  orderId: string
): Promise<{ success: true; order: IOrder } | { success: false; message: string }> {
  try {
    await requireSupportSubject()
    const id = orderId.trim()
    if (!id) return { success: false, message: 'Order id required' }
    const order = await getOrderById(id)
    return { success: true, order }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getSupportTicketQueue(
  filters?: SupportTicketFilters
): Promise<SupportTicketRow[]> {
  const { userId } = await requireSupportSession()
  const rows = await listSupportTickets({
    ...filters,
    currentUserId: userId,
  })
  return JSON.parse(JSON.stringify(rows))
}

export async function getSupportStaffOptions(): Promise<SupportStaffOption[]> {
  await requireSupportSession()
  const rows = await listSupportStaff()
  return JSON.parse(JSON.stringify(rows))
}

export async function assignSupportTicket(input: {
  orderId: string
  assigneeId?: string | null
}): Promise<{ success: boolean; message: string }> {
  try {
    const { session, userId } = await requireSupportSession()
    const orderId = input.orderId.trim()
    if (!orderId) return { success: false, message: 'Order id required' }
    const assigneeId = (input.assigneeId || userId).trim()
    if (!assigneeId) return { success: false, message: 'Assignee required' }

    const staff = await listSupportStaff()
    const target = staff.find((s) => s.id === assigneeId)
    if (!target) {
      return { success: false, message: 'Assignee must be support or admin' }
    }

    await upsertTicketAssignment({
      orderId,
      assigneeId,
      assignedBy: userId,
    })

    await logStaffAction({
      actorId: userId,
      actorRole: session.user.role,
      action: 'TICKET_ASSIGN',
      entityType: 'order',
      entityId: orderId,
      summary:
        assigneeId === userId
          ? `Claimed ticket for order ${orderId}`
          : `Assigned ticket for order ${orderId} to ${target.email}`,
      metadata: { assigneeId, assigneeEmail: target.email },
    })

    revalidatePath('/support/tickets')
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/admin/audit')
    return {
      success: true,
      message:
        assigneeId === userId
          ? 'Ticket claimed'
          : `Assigned to ${target.name}`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function unassignSupportTicket(
  orderId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { session, userId } = await requireSupportSession()
    const id = orderId.trim()
    if (!id) return { success: false, message: 'Order id required' }
    await clearTicketAssignment(id)
    await logStaffAction({
      actorId: userId,
      actorRole: session.user.role,
      action: 'TICKET_UNASSIGN',
      entityType: 'order',
      entityId: id,
      summary: `Released ticket for order ${id}`,
    })
    revalidatePath('/support/tickets')
    revalidatePath(`/account/orders/${id}`)
    revalidatePath('/admin/audit')
    return { success: true, message: 'Ticket released' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
