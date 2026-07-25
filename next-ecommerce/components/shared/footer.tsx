'use client'

import { ChevronUp } from 'lucide-react'
import { Button } from '../ui/custom/custom-button'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

const columns = [
  {
    title: 'Get to Know Us',
    links: [
      { label: 'About Us', href: '/page/about-us' },
      { label: 'Careers', href: '/page/careers' },
      { label: 'Press', href: '/page/press' },
    ],
  },
  {
    title: 'Make Money with Us',
    links: [
      { label: 'Sell products', href: '/page/sell' },
      { label: 'Become an Affiliate', href: '/page/affiliate' },
      { label: 'Advertise', href: '/page/advertise' },
    ],
  },
  {
    title: 'Let Us Help You',
    links: [
      { label: 'Your Account', href: '/account' },
      { label: 'Your Orders', href: '/account/orders' },
      { label: 'Help', href: '/page/help' },
      { label: 'Shipping & Returns', href: '/page/shipping' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className='mt-10 bg-chrome text-white'>
      <Button
        variant='ghost'
        className='w-full rounded-none bg-chrome-muted py-4 text-sm font-medium text-white hover:bg-slate-700 hover:text-white'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className='mr-2 h-4 w-4' />
        Back to top
      </Button>

      <div className='page-shell grid gap-8 px-4 py-10 md:grid-cols-3 md:px-6'>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className='font-display mb-3 text-base font-bold'>
              {column.title}
            </h3>
            <ul className='space-y-2 text-sm text-white/75'>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='transition hover:text-white hover:underline'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className='border-t border-white/10'>
        <div className='page-shell flex flex-col items-center gap-3 px-4 py-6 text-center text-sm text-white/70 md:px-6'>
          <Link href='/' className='font-display text-lg font-bold text-white'>
            {APP_NAME}
          </Link>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link href='/page/conditions-of-use' className='hover:underline'>
              Conditions of Use
            </Link>
            <Link href='/page/privacy-policy' className='hover:underline'>
              Privacy Policy
            </Link>
            <Link href='/page/help' className='hover:underline'>
              Help
            </Link>
          </div>
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
