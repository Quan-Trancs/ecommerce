'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProductPrice from '@/components/shared/product/product-price'
import { partialRefundOrder } from '@/lib/actions/order.actions'
import type { IOrder } from '@/lib/types/order'
import { roundToTwoDecimals } from '@/lib/utils'

export default function PartialRefundPanel({ order }: { order: IOrder }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const refundable = useMemo(
    () =>
      (order.items || []).filter((item) => {
        const id = item.id != null ? Number(item.id) : NaN
        if (!Number.isFinite(id)) return false
        if (item.isShipped) return false
        const remaining =
          Number(item.quantity) - (Number(item.refundedQuantity) || 0)
        return remaining > 0
      }),
    [order.items]
  )
  const [qtyById, setQtyById] = useState<Record<string, string>>({})

  const estimate = useMemo(() => {
    let itemsGross = 0
    for (const item of refundable) {
      const id = String(item.id)
      const qty = Math.max(0, Math.floor(Number(qtyById[id]) || 0))
      if (!qty) continue
      itemsGross += Number(item.price) * qty
    }
    itemsGross = roundToTwoDecimals(itemsGross)
    const taxShare =
      order.itemsPrice > 0
        ? roundToTwoDecimals((itemsGross / order.itemsPrice) * order.taxPrice)
        : 0
    return roundToTwoDecimals(itemsGross + taxShare)
  }, [qtyById, refundable, order.itemsPrice, order.taxPrice])

  if (refundable.length === 0) {
    return (
      <p className='text-xs text-muted-foreground'>
        No unshipped units left to refund.
      </p>
    )
  }

  return (
    <div className='space-y-3 rounded-md border border-dashed p-3'>
      <p className='text-sm font-medium'>Partial refund</p>
      <p className='text-xs text-muted-foreground'>
        Refund unshipped units (includes proportional tax). Restocks inventory.
      </p>
      <ul className='space-y-2'>
        {refundable.map((item) => {
          const id = String(item.id)
          const remaining =
            Number(item.quantity) - (Number(item.refundedQuantity) || 0)
          return (
            <li
              key={id}
              className='flex flex-wrap items-center justify-between gap-2 text-sm'
            >
              <div className='min-w-0 flex-1'>
                <p className='truncate font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>
                  <ProductPrice price={item.price} plain /> · {remaining}{' '}
                  remaining
                </p>
              </div>
              <Input
                type='number'
                min={0}
                max={remaining}
                className='h-8 w-20'
                value={qtyById[id] ?? '0'}
                disabled={pending}
                onChange={(e) =>
                  setQtyById((prev) => ({ ...prev, [id]: e.target.value }))
                }
              />
            </li>
          )
        })}
      </ul>
      <div className='flex items-center justify-between text-sm'>
        <span>Est. refund</span>
        <span className='font-medium'>
          <ProductPrice price={estimate} plain />
        </span>
      </div>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={pending || estimate <= 0}
        onClick={() => {
          const lines = refundable
            .map((item) => ({
              orderItemId: Number(item.id),
              quantity: Math.max(
                0,
                Math.floor(Number(qtyById[String(item.id)]) || 0)
              ),
            }))
            .filter((l) => l.quantity > 0)
          if (!lines.length) {
            toast.error('Enter quantities to refund')
            return
          }
          startTransition(async () => {
            const result = await partialRefundOrder(order._id, lines)
            if (result.success) {
              toast.success(result.message)
              setQtyById({})
              router.refresh()
            } else {
              toast.error(result.message)
            }
          })
        }}
      >
        {pending ? 'Refunding…' : 'Issue partial refund'}
      </Button>
    </div>
  )
}
