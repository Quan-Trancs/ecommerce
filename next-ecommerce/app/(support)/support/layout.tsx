import Link from 'next/link'
import { requireSupport } from '@/lib/auth/require-role'

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSupport()

  const nav = [
    { href: '/support', label: 'Orders' },
    { href: '/support/tickets', label: 'Tickets' },
    { href: '/account', label: 'Account' },
  ]

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary'>
            Support
          </p>
          <h1 className='font-display text-3xl font-extrabold tracking-tight'>
            Customer service
          </h1>
        </div>
        <nav className='flex flex-wrap gap-2 text-sm'>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='rounded-md border px-3 py-1.5 hover:border-primary hover:text-primary'
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
