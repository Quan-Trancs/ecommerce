import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { APP_COPYRIGHT } from '@/lib/constants'
import { Toaster } from 'sonner'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col items-center min-h-screen highlight-link'>
      <header className=''>
        <Link href='/'>
          <Image
            src='/icons/logo.svg'
            alt='logo'
            width={64}
            height={64}
            priority
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </Link>
      </header>
      <main className='mx-auto max-w-sm min-w-80 p-4'>
        <Toaster />
        {children}
      </main>
      <footer className=' flex-1 mt-4 bg-white w-full flex flex-col gap-4 items-center p-8 text-sm border-t-[1.5px] border-t-gray-300'>
        <div>
          <p className='text-[#565959] text-xs'>{APP_COPYRIGHT}</p>
        </div>
      </footer>
    </div>
  )
}
