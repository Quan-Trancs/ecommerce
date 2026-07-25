import Link from 'next/link'
import ComparePageClient from './compare-page-client'

export const metadata = { title: 'Compare products' }

export default function ComparePage() {
  return (
    <div className='page-shell space-y-6 px-4 py-8 md:px-6'>
      <div>
        <p className='text-sm text-muted-foreground'>
          <Link href='/search' className='hover:text-foreground'>
            Search
          </Link>
          <span className='mx-2'>/</span>
          Compare
        </p>
        <h1 className='mt-2 font-display text-3xl font-extrabold tracking-tight'>
          Compare products
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Side-by-side specs for up to four products.
        </p>
      </div>
      <ComparePageClient />
    </div>
  )
}
