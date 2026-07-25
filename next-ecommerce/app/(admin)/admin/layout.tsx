import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/require-role'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  const nav = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/catalog', label: 'Catalog' },
    { href: '/admin/coupons', label: 'Coupons' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/account', label: 'Account' },
  ]

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary'>
            Admin
          </p>
          <h1 className='font-display text-3xl font-extrabold tracking-tight'>
            Platform console
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
