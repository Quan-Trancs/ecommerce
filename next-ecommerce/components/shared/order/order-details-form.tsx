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

export default function OrderDetailsForm({
  order,
  canCancelElevated = false,
}: {
  order: IOrder
  isAdmin: boolean
  /** Support/admin may cancel paid (non-shipped) orders without refund. */
  canCancelElevated?: boolean
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
                {items.map((item) => (
                  <TableRow key={item.slug}>
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
                    </TableCell>
                    <TableCell>
                      <span className='px-2'>{item.quantity}</span>
                    </TableCell>
                    <TableCell className='text-right'>${item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
                  label={isPaid ? 'Cancel (no refund)' : 'Cancel order'}
                />
                {isPaid ? (
                  <p className='text-xs text-muted-foreground'>
                    Cancels fulfillment and restores stock. Does not refund
                    payment processors.
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
