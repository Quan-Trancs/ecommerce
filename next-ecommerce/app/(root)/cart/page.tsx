'use client'

import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import ProductPrice from '@/components/shared/product/product-price'
import { Button } from '@/components/ui/custom/custom-button'
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
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className='page-shell space-y-8 p-4 md:p-6'>
      <div className='grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-6'>
        {items.length === 0 ? (
          <div className='brick col-span-4 px-6 py-14 text-center'>
            <p className='brick-label'>Cart</p>
            <h1 className='brick-title mt-2 text-2xl md:text-3xl'>
              Your shopping cart is empty
            </h1>
            <p className='mt-2 text-sm text-slate-500'>
              Snap in some finds from the catalog to get started.
            </p>
            <Link href='/search' className='brick-cta mt-6 inline-flex'>
              Shop today&apos;s deals
            </Link>
          </div>
        ) : (
          <>
            <div className='brick col-span-1 p-4 md:col-span-3 md:p-5'>
              <div className='section-band'>
                <div>
                  <p className='brick-label mb-1'>Cart</p>
                  <h1 className='brick-title text-2xl md:text-3xl'>
                    Shopping Cart
                  </h1>
                </div>
                <p className='font-mono text-xs uppercase tracking-wider text-slate-500'>
                  Price
                </p>
              </div>

              {items.map((item) => (
                <div
                  key={item.clientId}
                  className='flex flex-col justify-between gap-4 border-b border-dashed border-slate-900/10 py-4 md:flex-row'
                >
                  <Link href={`/product/${item.slug}`}>
                    <div className='brick-media relative h-36 w-36 bg-white'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='144px'
                        className='object-contain p-2'
                      />
                    </div>
                  </Link>

                  <div className='flex-1 space-y-3'>
                    <Link
                      href={`/product/${item.slug}`}
                      className='text-lg font-semibold text-chrome hover:text-deal'
                    >
                      {item.name}
                    </Link>
                    <div className='space-y-0.5 text-sm text-slate-600'>
                      <p>
                        <span className='font-bold text-chrome'>Color:</span>{' '}
                        {item.color}
                      </p>
                      <p>
                        <span className='font-bold text-chrome'>Size:</span>{' '}
                        {item.size}
                      </p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <Select
                        value={item.quantity.toString()}
                        onValueChange={(quantity) =>
                          updateItem(item, Number(quantity))
                        }
                      >
                        <SelectTrigger className='w-auto rounded-none border-slate-900/20'>
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
                        variant='outline'
                        className='rounded-none border-slate-900/20'
                        onClick={() => removeItem(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className='text-right'>
                    {item.quantity > 1 && (
                      <p className='filter-count mb-1'>
                        {item.quantity} × <ProductPrice price={item.price} plain />
                      </p>
                    )}
                    <span className='text-lg font-bold text-chrome'>
                      <ProductPrice
                        price={item.quantity * item.price}
                        plain
                      />
                    </span>
                  </div>
                </div>
              ))}

              <div className='mt-3 flex justify-end text-lg'>
                Subtotal ({itemCount} items):{' '}
                <span className='ml-1 font-bold'>
                  <ProductPrice price={itemsPrice} plain />
                </span>
              </div>
            </div>

            <aside>
              <div className='brick-buybox space-y-4'>
                <p className='brick-label'>Checkout</p>
                {itemsPrice < FREE_SHIPPING_MINIMUM_PRICE ? (
                  <p className='text-sm text-slate-600'>
                    Add{' '}
                    <span className='font-semibold text-emerald-700'>
                      <ProductPrice
                        price={FREE_SHIPPING_MINIMUM_PRICE - itemsPrice}
                        plain
                      />
                    </span>{' '}
                    more to qualify for FREE shipping.
                  </p>
                ) : (
                  <p className='text-sm font-semibold text-emerald-700'>
                    Your order qualifies for FREE shipping
                  </p>
                )}
                <p className='text-lg text-chrome'>
                  Subtotal ({itemCount} items):{' '}
                  <span className='font-bold'>
                    <ProductPrice price={itemsPrice} plain />
                  </span>
                </p>
                <button
                  type='button'
                  onClick={() => router.push('/checkout')}
                  className='brick-cta w-full'
                >
                  Proceed to Checkout
                </button>
              </div>
            </aside>
          </>
        )}
      </div>

      <section className='store-section'>
        <BrowsingHistoryList />
      </section>
    </div>
  )
}
