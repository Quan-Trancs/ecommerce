'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IOrder } from '@/lib/types/order'
import { cn, formatDateTime } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import ProductPrice from '../product/product-price'
import CancelOrderButton from './cancel-order-button'
import PartialRefundPanel from './partial-refund-panel'
import OrderReturnsPanel from './order-returns-panel'
import OrderNotesThread from './order-notes-thread'
import type { OrderNote } from '@/lib/actions/order.actions'
import type { OrderReturnRequest } from '@/lib/actions/return.actions'

export default function OrderDetailsForm({
  order,
  canCancelElevated = false,
  notes = [],
  inAppMuted = false,
  coupon,
  giftCard,
  returns = [],
  reservedByItemId = {},
  isBuyer = false,
}: {
  order: IOrder
  isAdmin: boolean
  /** Support/admin may cancel paid (non-shipped) orders; PayPal refunds when possible. */
  canCancelElevated?: boolean
  notes?: OrderNote[]
  inAppMuted?: boolean
  coupon?: { code: string; discountAmount: number } | null
  giftCard?: { code: string; amount: number } | null
  returns?: OrderReturnRequest[]
  reservedByItemId?: Record<string, number>
  isBuyer?: boolean
}) {
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
    status,
  } = order

  const statusUpper = (status || '').toUpperCase()
  const isCancelled = statusUpper === 'CANCELLED'
  const isShipped = statusUpper === 'SHIPPED' || isDelivered
  const hasShippedLines = Boolean(order.hasShippedLines) || isShipped
  const buyerCanCancel =
    !isCancelled &&
    !hasShippedLines &&
    !isPaid &&
    statusUpper === 'PENDING'
  const staffCanCancel =
    canCancelElevated && !isCancelled && !hasShippedLines
  const staffCanPartialRefund =
    canCancelElevated && !isCancelled && Boolean(isPaid)
  const paidRefundLabel =
    paymentMethod === 'PayPal'
      ? 'Cancel & refund (PayPal)'
      : paymentMethod === 'Stripe'
        ? 'Cancel & refund (Stripe)'
        : 'Cancel (no auto-refund)'

  return (
    <div className='grid md:grid-cols-3 md:gap-5'>
      <div className='overflow-x-auto md:col-span-2 space-y-4'>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>Shipping Address</h2>
            <p>
              {shippingAddress.fullName} {shippingAddress.phone}
            </p>
            <p>
              {shippingAddress.street}, {shippingAddress.city},{' '}
              {shippingAddress.province}, {shippingAddress.postalCode},{' '}
              {shippingAddress.country}{' '}
            </p>

            {isCancelled ? (
              <Badge variant='destructive'>Cancelled</Badge>
            ) : isDelivered ? (
              <Badge>
                Delivered at {formatDateTime(deliveredAt!).dateTime}
              </Badge>
            ) : (
              <div>
                {' '}
                <Badge variant='destructive'>Not delivered</Badge>
                <div>
                  Expected delivery at{' '}
                  {formatDateTime(expectedDeliveryDate!).dateTime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 gap-4'>
            <h2 className='text-xl pb-4'>Payment Method</h2>
            <p>{paymentMethod}</p>
            {isPaid ? (
              <Badge>Paid at {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant='destructive'>Not paid</Badge>
            )}
            {status ? (
              <p className='pt-2 text-sm text-muted-foreground'>
                Status: {status}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4   gap-4'>
            <h2 className='text-xl pb-4'>Order Items</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const refunded = Number(item.refundedQuantity) || 0
                  const remaining = Math.max(0, Number(item.quantity) - refunded)
                  return (
                  <TableRow key={`${item.slug}-${item.id || item.clientId}`}>
                    <TableCell>
                      <Link
                        href={`/product/${item.slug}`}
                        className='flex items-center'
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={50}
                          height={50}
                        ></Image>
                        <span className='px-2'>{item.name}</span>
                      </Link>
                      {item.isShipped ? (
                        <p className='pl-14 text-xs text-muted-foreground'>
                          Shipped
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>
                        {remaining}
                        {refunded > 0 ? (
                          <span className='text-xs text-muted-foreground'>
                            {' '}
                            ({refunded} refunded)
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>${item.price}</TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <OrderReturnsPanel
          order={order}
          returns={returns}
          reservedByItemId={reservedByItemId}
          isBuyer={isBuyer}
          canReview={canCancelElevated}
        />
        <OrderNotesThread
          orderId={order._id}
          initialNotes={notes}
          canPostInternal={canCancelElevated}
          inAppMuted={inAppMuted}
        />
      </div>
      <div>
        <Card>
          <CardContent className='p-4  space-y-4 gap-4'>
            <h2 className='text-xl pb-4'>Order Summary</h2>
            <div className='flex justify-between'>
              <div>Items</div>
              <div>
                {' '}
                <ProductPrice price={itemsPrice} plain />
              </div>
            </div>
            {coupon && coupon.discountAmount > 0 ? (
              <div className='flex justify-between text-emerald-700'>
                <div>Promo ({coupon.code})</div>
                <div>
                  -<ProductPrice price={coupon.discountAmount} plain />
                </div>
              </div>
            ) : null}
            {giftCard && giftCard.amount > 0 ? (
              <div className='flex justify-between text-emerald-700'>
                <div>Gift card ({giftCard.code})</div>
                <div>
                  -<ProductPrice price={giftCard.amount} plain />
                </div>
              </div>
            ) : null}
            <div className='flex justify-between'>
              <div>Tax</div>
              <div>
                {' '}
                <ProductPrice price={taxPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>Shipping</div>
              <div>
                {' '}
                <ProductPrice price={shippingPrice} plain />
              </div>
            </div>
            <div className='flex justify-between'>
              <div>Total</div>
              <div>
                {' '}
                <ProductPrice price={totalPrice} plain />
              </div>
            </div>

            <a
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              href={`/api/orders/${order._id}/invoice`}
            >
              Download invoice (PDF)
            </a>

            {!isPaid &&
              !isCancelled &&
              ['Stripe', 'PayPal'].includes(paymentMethod) && (
                <Link
                  className={cn(buttonVariants(), 'w-full')}
                  href={`/checkout/${order._id}`}
                >
                  Pay Order
                </Link>
              )}
            {buyerCanCancel ? (
              <CancelOrderButton orderId={order._id} />
            ) : null}
            {staffCanCancel && !buyerCanCancel ? (
              <div className='space-y-2'>
                <CancelOrderButton
                  orderId={order._id}
                  label={isPaid ? paidRefundLabel : 'Cancel order'}
                  confirmMessage={
                    isPaid &&
                    (paymentMethod === 'PayPal' || paymentMethod === 'Stripe')
                      ? `Cancel this paid order and submit a ${paymentMethod} refund? Stock will be restored.`
                      : isPaid
                        ? 'Cancel this paid order and restore stock? Automatic refund is not available for this payment method.'
                        : undefined
                  }
                />
                {isPaid && paymentMethod === 'PayPal' ? (
                  <p className='text-xs text-muted-foreground'>
                    Restores stock and refunds the PayPal capture when credentials
                    are configured.
                  </p>
                ) : null}
                {isPaid && paymentMethod === 'Stripe' ? (
                  <p className='text-xs text-muted-foreground'>
                    Restores stock and refunds the Stripe PaymentIntent when
                    credentials are configured.
                  </p>
                ) : null}
              </div>
            ) : null}
            {staffCanPartialRefund ? (
              <PartialRefundPanel order={order} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
