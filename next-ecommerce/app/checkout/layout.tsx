import CartButton from '@/components/shared/header/cart-button'
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card'
import { APP_NAME } from '@/lib/constants'
import { HoverCardTrigger } from '@radix-ui/react-hover-card'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <header className='bg-[#131921] text-white'>
        <div className='px-2'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center'>
              <Link
                href='/'
                className='flex items-center header-button font-extrabold text-lg m-1'
              >
                <Image
                  src='/icons/logo-dark.svg'
                  alt={`${APP_NAME} logo`}
                  width={40}
                  height={40}
                  color='white'
                />
                {APP_NAME}
              </Link>
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className='hidden md:block flex-1 max-w-xl text-center  font-bold text-3xl'>
                  Secure Checkout
                </div>
              </HoverCardTrigger>
              <HoverCardContent className='text-xs w-100'>
                We secure your payment and personal information when you share
                or save it with us. We don&apos;t share payment details with
                third-party sellers. We don&apos;t sell your information to
                others.
              </HoverCardContent>
            </HoverCard>
            <CartButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
