import useCartStore from '@/hooks/use-cart-store'
import ProductPrice from './product/product-price'
import { FREE_SHIPPING_MINIMUM_PRICE } from '@/lib/constants'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '../ui/custom/custom-button'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import Image from 'next/image'
import { TrashIcon } from 'lucide-react'

export default function CartSidebar() {
  const {
    cart: { items, itemsPrice },
    removeItem,
    updateItem,
  } = useCartStore()

  const freeShippingMinPrice = FREE_SHIPPING_MINIMUM_PRICE

  return (
    <div className='w-25 overflow-y-auto mr-1'>
      <div className={`fixed  h-full border-l`}>
        <div className='py-2 h-full flex flex-col gap-2 justify-start items-center'>
          <div className='text-center'>
            <div className='text-xs'> Subtotal</div>
            <div className='font-bold text-sm text-primary'>
              <ProductPrice price={itemsPrice} plain />
            </div>
            {itemsPrice > freeShippingMinPrice && (
              <div className=' text-center text-xs'>
                Your order qualifies for FREE Shipping
              </div>
            )}

            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'rounded-full hover:no-underline w-full text-xs font-normal border-gray-500 h-5 w-24'
              )}
              href='/cart'
            >
              Go to Cart
            </Link>
            <Separator className='mt-3 bg-gray-300' />
          </div>

          <ScrollArea className='flex-1  w-full'>
            {items.map((item) => (
              <div key={item.clientId}>
                <div className='my-3'>
                  <Link href={`/product/${item.slug}`}>
                    <div className='relative h-27'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='20vw'
                        className='object-contain'
                      />
                    </div>
                  </Link>
                  <div className='text-sm text-center font-bold'>
                    <ProductPrice price={item.price} plain />
                  </div>
                  <div className='flex gap-2 mt-2 h-5'>
                    <Select
                      value={item.quantity.toString()}
                      onValueChange={(value) => {
                        updateItem(item, Number(value))
                      }}
                    >
                      <SelectTrigger
                        className='text-xs w-13 ml-1 h-auto py-0 border-1 border-gray-300 text-black cursor-pointer'
                        triggerSize='h-5 pr-2 pl-3 py-0'
                        iconClassName='w-3 h-3 stroke-4 text-black'
                      >
                        <SelectValue className='text-xs' />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: item.countInStock }).map(
                          (_, i) => (
                            <SelectItem value={(i + 1).toString()} key={i + 1}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={'outline'}
                      className='text-xs h-auto w-[27px] rounded-full py-0 border-1 border-gray-400 text-black cursor-pointer'
                      title={`Delete ${item.quantity} items`}
                      onClick={() => {
                        removeItem(item)
                      }}
                    >
                      <TrashIcon className='!w-[14px] !h-[13px] ' />
                    </Button>
                  </div>
                </div>
                <Separator className='bg-gray-300' />
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
