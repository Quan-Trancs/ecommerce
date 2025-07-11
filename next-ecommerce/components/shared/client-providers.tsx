'use client'

import { Toaster } from 'sonner'
import CartSidebar from './cart-sidebar'
import useCartSidebar from '@/hooks/use-cart-sidebar'

export default function ClientProviders({
  children,
}: {
  children?: any
}) {
  const isCartSidebarOpen = useCartSidebar()

  return (
    <>
      {isCartSidebarOpen ? (
        <div className='flex min-h-screen'>
          <div className='flex-1 overflow-hidden'>{children}</div>
          <CartSidebar />
        </div>
      ) : (
        <div>{children}</div>
      )}

      <Toaster />
    </>
  )
}
