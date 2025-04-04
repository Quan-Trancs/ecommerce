'use client'

import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/custom/custom-button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { FREE_SHIPPING_MINIMUM_PRICE } from '@/lib/constants'
import { SelectContent } from '@radix-ui/react-select'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const {
    cart: { items, itemsPrice },
    removeItem,
    updateItem,
  } = useCartStore()

  const router = useRouter()

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-4 md:gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-none'>
            <CardHeader className='text-3xl'>
              Your Shopping Cart is empty
            </CardHeader>
            <CardContent>
              <Link href='/'>{"Shop today's deals"}</Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='col-span-3'>
              <Card className='rounded-none'>
                <CardHeader className='text-3xl pb-0'>Shopping Cart</CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>Price</div>
                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col md:flex-row justify-between gap-4 border-b py-4'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative w-40 h-40'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={'/product/' + item.slug}
                          className='text-lg hover:no-underline'
                        >
                          {item.name}
                        </Link>
                        <div>
                          <p className='text-sm'>
                            <span className='font-bold'>Color: </span>{' '}
                            {item.color}
                          </p>
                          <p className='text-sm'>
                            <span className='font-bold'>Size: </span>{' '}
                            {item.size}
                          </p>
                        </div>

                        <div className='flex gap-2 items-center'>
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(quantity) =>
                              updateItem(item, Number(quantity))
                            }
                          >
                            <SelectTrigger className='w-auto'>
                              <SelectValue>
                                Quantity: {item.quantity}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                              {Array.from({ length: item.countInStock }).map(
                                (_, i) => (
                                  <SelectItem key={i + 1} value={`${i + 1}`}>
                                    {i + 1}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>

                          <Button
                            variant={'outline'}
                            onClick={() => removeItem(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.quantity * item.price}
                              plain
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className='flex justify-end text-lg my-2'>
                    Subtotal (
                    {items.reduce((acc, item) => acc + item.quantity, 0)}{' '}
                    Items):{' '}
                    <span className='font-bold ml-1'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className='rounded-none'>
                <CardContent className='py-4 space-y-4'>
                  {itemsPrice < FREE_SHIPPING_MINIMUM_PRICE ? (
                    <div className='flex-1'>
                      Add{' '}
                      <span className='text-green-700'>
                        <ProductPrice
                          price={FREE_SHIPPING_MINIMUM_PRICE - itemsPrice}
                          plain
                        />
                      </span>{' '}
                      of eligible items to your order to qualify for FREE
                      Shipping
                    </div>
                  ) : (
                    <div className='flex-1'>
                      <span className='text-green-700'>
                        your order qualifies for FREE Shipping
                      </span>{' '}
                      choose this option at checkout
                    </div>
                  )}
                  <div className='text-lg'>
                    Subtotal(
                    {items.reduce((acc, item) => acc + item.quantity, 0)}
                    Items):{' '}
                    <span className='font-bold'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>

                  <Button
                    onClick={() => router.push('/checkout')}
                    className='w-full rounded-full'
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
