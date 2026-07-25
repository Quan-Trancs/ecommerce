'use client'

import { ChevronUp } from 'lucide-react'
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
    <footer className='mt-12 bg-chrome text-white'>
      <button
        type='button'
        className='flex w-full items-center justify-center gap-2 border-b border-white/10 bg-chrome-muted py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white/90 transition hover:bg-slate-700'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className='h-4 w-4' />
        Back to top
      </button>

      <div className='page-shell grid gap-8 px-4 py-10 md:grid-cols-3 md:px-6'>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className='mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary'>
              {column.title}
            </h3>
            <ul className='space-y-2 text-sm text-white/75'>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='transition hover:text-primary hover:underline'
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
          <Link
            href='/'
            className='font-display text-xl font-extrabold tracking-tight text-white'
          >
            {APP_NAME}
          </Link>
          <div className='flex flex-wrap justify-center gap-4 font-mono text-[11px] uppercase tracking-wider'>
            <Link href='/page/conditions-of-use' className='hover:text-primary'>
              Conditions of Use
            </Link>
            <Link href='/page/privacy-policy' className='hover:text-primary'>
              Privacy Policy
            </Link>
            <Link href='/page/help' className='hover:text-primary'>
              Help
            </Link>
          </div>
          <p className='text-white/50'>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
