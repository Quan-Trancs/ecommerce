import Link from 'next/link'
import { requireSeller } from '@/lib/auth/require-role'

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSeller()

  const nav = [
    { href: '/seller', label: 'Overview' },
    { href: '/seller/products', label: 'Products' },
    { href: '/seller/orders', label: 'Orders' },
    { href: '/seller/earnings', label: 'Earnings' },
    { href: '/account', label: 'Buyer account' },
  ]

  return (
    <div className='page-shell px-4 py-8 md:px-6'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-primary'>
            Seller
          </p>
          <h1 className='font-display text-3xl font-extrabold tracking-tight'>
            Seller workspace
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
