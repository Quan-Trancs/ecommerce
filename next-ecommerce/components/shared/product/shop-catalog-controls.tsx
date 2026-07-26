import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ShopProductSort } from '@/lib/db/seller-shop'

function hrefFor(
  basePath: string,
  opts: { q?: string | null; sort?: ShopProductSort; inStockOnly?: boolean }
) {
  const params = new URLSearchParams()
  if (opts.q) params.set('q', opts.q)
  if (opts.sort && opts.sort !== 'newest') params.set('sort', opts.sort)
  if (opts.inStockOnly) params.set('stock', '1')
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export default function ShopCatalogControls({
  basePath,
  query,
  sort,
  inStockOnly,
}: {
  basePath: string
  query: string | null
  sort: ShopProductSort
  inStockOnly: boolean
}) {
  const sorts: Array<{ id: ShopProductSort; label: string }> = [
    { id: 'newest', label: 'Newest' },
    { id: 'price-asc', label: 'Price ↑' },
    { id: 'price-desc', label: 'Price ↓' },
    { id: 'name', label: 'Name' },
  ]

  return (
    <div className='space-y-3'>
      <form
        action={basePath}
        method='get'
        className='flex flex-wrap items-center gap-2'
      >
        {sort !== 'newest' ? (
          <input type='hidden' name='sort' value={sort} />
        ) : null}
        {inStockOnly ? <input type='hidden' name='stock' value='1' /> : null}
        <input
          type='search'
          name='q'
          defaultValue={query || ''}
          placeholder='Search this shop…'
          className='min-w-[200px] flex-1 rounded-md border bg-background px-3 py-2 text-sm'
          maxLength={80}
        />
        <Button type='submit' size='sm' variant='secondary'>
          Search
        </Button>
        {query ? (
          <Link
            href={hrefFor(basePath, { sort, inStockOnly })}
            className='text-sm text-muted-foreground underline'
          >
            Clear
          </Link>
        ) : null}
      </form>
      <div className='flex flex-wrap gap-2 text-sm'>
        {sorts.map((tab) => (
          <Link
            key={tab.id}
            href={hrefFor(basePath, {
              q: query,
              sort: tab.id,
              inStockOnly,
            })}
            className={
              sort === tab.id
                ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
                : 'rounded-md border px-3 py-1.5 hover:border-primary'
            }
          >
            {tab.label}
          </Link>
        ))}
        <Link
          href={hrefFor(basePath, {
            q: query,
            sort,
            inStockOnly: !inStockOnly,
          })}
          className={
            inStockOnly
              ? 'rounded-md border border-primary px-3 py-1.5 text-primary'
              : 'rounded-md border px-3 py-1.5 hover:border-primary'
          }
        >
          In stock
        </Link>
      </div>
    </div>
  )
}
