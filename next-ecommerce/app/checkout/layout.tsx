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
      <header className='bg-chrome text-white'>
        <div className='page-shell px-3 md:px-4'>
          <div className='flex items-center justify-between py-3'>
            <div className='flex items-center'>
              <Link
                href='/'
                className='header-button m-0 flex items-center gap-2 font-display text-lg font-extrabold'
              >
                <Image
                  src='/icons/logo-dark.svg'
                  alt={`${APP_NAME} logo`}
                  width={36}
                  height={36}
                />
                {APP_NAME}
              </Link>
            </div>
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className='hidden flex-1 text-center font-display text-2xl font-bold md:block'>
                  Secure Checkout
                </div>
              </HoverCardTrigger>
              <HoverCardContent className='w-100 text-xs'>
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
