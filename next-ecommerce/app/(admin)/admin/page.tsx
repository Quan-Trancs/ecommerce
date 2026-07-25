import Link from 'next/link'

export const metadata = { title: 'Admin' }

export default function AdminHomePage() {
  return (
    <div className='space-y-4'>
      <p className='max-w-2xl text-muted-foreground'>
        Platform operators can manage accounts and override catalog writes via{' '}
        <code className='text-sm'>X-Admin-Key</code> / admin APIs.
      </p>
      <ul className='grid gap-3 sm:grid-cols-2'>
        <li>
          <Link
            href='/admin/users'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Users & roles</h2>
            <p className='text-sm text-muted-foreground'>
              Buyer / seller / support / admin accounts
            </p>
          </Link>
        </li>
        <li>
          <Link
            href='/admin/catalog'
            className='block rounded-lg border p-4 transition hover:border-primary'
          >
            <h2 className='font-semibold'>Catalog</h2>
            <p className='text-sm text-muted-foreground'>
              Cross-seller product moderation
            </p>
          </Link>
        </li>
      </ul>
    </div>
  )
}
