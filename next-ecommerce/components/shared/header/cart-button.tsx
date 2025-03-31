'use client'

import useCartStore from '@/hooks/use-cart-store'
import useIsMounted from '@/hooks/use-is-mounted'
import { cn } from '@/lib/utils'
import { ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'

export default function CartButton() {
  const isMounted = useIsMounted()
  const {
    cart: { items },
  } = useCartStore()

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <Link href='/cart' className='header-button px-1 '>
      <div className='flex items-end text-xs relative'>
        <ShoppingCartIcon className='w-8 h-8' />

        {isMounted && (
          <span
            className={cn(
              'bg-[#131921]  px-1 rounded-full text-primary text-base font-bold absolute right-[30px] top-[-4px] z-10',
              cartItemsCount >= 10 && 'text-sm px-0 p-[1px]'
            )}
          >
            {cartItemsCount}
          </span>
        )}

        <span className='font-bold'>Cart</span>
      </div>
    </Link>
  )
}
