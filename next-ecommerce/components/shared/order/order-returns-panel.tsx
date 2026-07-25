'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  cancelMyReturnRequest,
  reviewOrderReturn,
  submitReturnRequest,
  type OrderReturnRequest,
} from '@/lib/actions/return.actions'
import { RETURN_REASONS } from '@/lib/returns/constants'
import type { IOrder } from '@/lib/types/order'
import { formatDateTime } from '@/lib/utils'

function statusLabel(status: string) {
  const upper = (status || '').toUpperCase()
  if (upper === 'REQUESTED') return 'Requested'
  if (upper === 'APPROVED') return 'Approved'
  if (upper === 'REJECTED') return 'Rejected'
  if (upper === 'CANCELLED') return 'Cancelled'
  return status
}

function reasonLabel(reason: string) {
  return (
    RETURN_REASONS.find((r) => r.value === reason)?.label || reason || 'Other'
  )
}

export default function OrderReturnsPanel({
  order,
  returns,
  reservedByItemId,
  isBuyer,
  canReview,
}: {
  order: IOrder
  returns: OrderReturnRequest[]
  reservedByItemId: Record<string, number>
  isBuyer: boolean
  canReview: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [reason, setReason] = useState(RETURN_REASONS[0]?.value || 'OTHER')
  const [note, setNote] = useState('')
  const [qtyById, setQtyById] = useState<Record<string, string>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [processRefundById, setProcessRefundById] = useState<
    Record<string, boolean>
  >({})

  const returnable = useMemo(() => {
    return (order.items || []).filter((item) => {
      const id = item.id != null ? Number(item.id) : NaN
      if (!Number.isFinite(id)) return false
      if (!item.isShipped) return false
      const refunded = Number(item.refundedQuantity) || 0
      const reserved = reservedByItemId[String(id)] || 0
      const available = Math.max(0, Number(item.quantity) - refunded - reserved)
      return available > 0
    })
  }, [order.items, reservedByItemId])

  const status = String(order.status || '').toUpperCase()
  const canRequest =
    isBuyer &&
    Boolean(order.isPaid) &&
    status !== 'CANCELLED' &&
    returnable.length > 0

  function submit() {
    const lines = returnable
      .map((item) => ({
        orderItemId: Number(item.id),
        quantity: Math.max(0, Math.floor(Number(qtyById[String(item.id)]) || 0)),
      }))
      .filter((l) => l.quantity > 0)

    startTransition(async () => {
      const result = await submitReturnRequest({
        orderId: order._id,
        reason,
        note,
        lines,
      })
      if (result.success) {
        toast.success(result.message)
        setQtyById({})
        setNote('')
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className='space-y-4 rounded-md border p-4'>
      <div>
        <h2 className='text-xl'>Returns</h2>
        <p className='text-xs text-muted-foreground'>
          Request a return on shipped items. Approving can refund and restock
          automatically (PayPal/Stripe when available).
        </p>
      </div>

      {returns.length > 0 ? (
        <ul className='space-y-3'>
          {returns.map((ret) => (
            <li
              key={ret.id}
              className='space-y-2 rounded-md border border-dashed p-3 text-sm'
            >
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='font-medium'>
                  #{ret.id} · {statusLabel(ret.status)} ·{' '}
                  {reasonLabel(ret.reason)}
                </p>
                <span className='text-xs text-muted-foreground'>
                  {formatDateTime(new Date(ret.createdAt)).dateTime}
                </span>
              </div>
              <p className='text-xs text-muted-foreground'>
                {ret.items
                  .map((i) => `${i.name || `Item ${i.orderItemId}`} ×${i.quantity}`)
                  .join(' · ')}
              </p>
              {ret.note ? (
                <p className='text-xs text-muted-foreground'>Buyer: {ret.note}</p>
              ) : null}
              {ret.reviewNote ? (
                <p className='text-xs text-muted-foreground'>
                  Staff: {ret.reviewNote}
                </p>
              ) : null}
              {ret.status === 'APPROVED' && ret.refundAmount != null ? (
                <p className='text-xs text-muted-foreground'>
                  Refund ${Number(ret.refundAmount).toFixed(2)}
                  {ret.refundId ? ` · ${ret.refundId}` : ''}
                  {ret.refundSkipped ? ' · processor skipped' : ''}
                </p>
              ) : null}
              {isBuyer && ret.status === 'REQUESTED' ? (
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await cancelMyReturnRequest(ret.id)
                      if (result.success) {
                        toast.success(result.message)
                        router.refresh()
                      } else toast.error(result.message)
                    })
                  }}
                >
                  Cancel request
                </Button>
              ) : null}
              {canReview && ret.status === 'REQUESTED' ? (
                <div className='space-y-2 border-t pt-2'>
                  <Input
                    placeholder='Review note (optional)'
                    value={reviewNotes[String(ret.id)] || ''}
                    onChange={(e) =>
                      setReviewNotes((prev) => ({
                        ...prev,
                        [String(ret.id)]: e.target.value,
                      }))
                    }
                  />
                  <label className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <input
                      type='checkbox'
                      checked={processRefundById[String(ret.id)] !== false}
                      onChange={(e) =>
                        setProcessRefundById((prev) => ({
                          ...prev,
                          [String(ret.id)]: e.target.checked,
                        }))
                      }
                    />
                    Refund &amp; restock on approve
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      size='sm'
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await reviewOrderReturn({
                            returnId: ret.id,
                            decision: 'APPROVED',
                            reviewNote: reviewNotes[String(ret.id)],
                            processRefund:
                              processRefundById[String(ret.id)] !== false,
                          })
                          if (result.success) {
                            toast.success(result.message)
                            router.refresh()
                          } else toast.error(result.message)
                        })
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await reviewOrderReturn({
                            returnId: ret.id,
                            decision: 'REJECTED',
                            reviewNote: reviewNotes[String(ret.id)],
                            processRefund: false,
                          })
                          if (result.success) {
                            toast.success(result.message)
                            router.refresh()
                          } else toast.error(result.message)
                        })
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm text-muted-foreground'>No return requests yet.</p>
      )}

      {canRequest ? (
        <div className='space-y-3 border-t pt-3'>
          <p className='text-sm font-medium'>Request a return</p>
          <label className='block space-y-1 text-sm'>
            <span className='text-xs text-muted-foreground'>Reason</span>
            <select
              className='h-9 w-full rounded-md border bg-background px-3 text-sm'
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
            >
              {RETURN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <ul className='space-y-2'>
            {returnable.map((item) => {
              const id = String(item.id)
              const refunded = Number(item.refundedQuantity) || 0
              const reserved = reservedByItemId[id] || 0
              const available = Math.max(
                0,
                Number(item.quantity) - refunded - reserved
              )
              return (
                <li
                  key={id}
                  className='flex flex-wrap items-center justify-between gap-2 text-sm'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium'>{item.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {available} returnable
                    </p>
                  </div>
                  <Input
                    type='number'
                    min={0}
                    max={available}
                    className='w-20'
                    value={qtyById[id] ?? ''}
                    onChange={(e) =>
                      setQtyById((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                  />
                </li>
              )
            })}
          </ul>
          <Input
            placeholder='Optional note for support'
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type='button' disabled={pending} onClick={submit}>
            Submit return request
          </Button>
        </div>
      ) : isBuyer && status !== 'CANCELLED' && order.isPaid ? (
        <p className='text-xs text-muted-foreground'>
          No shipped units available to return (or quantities are already in an
          open request).
        </p>
      ) : null}
    </div>
  )
}
