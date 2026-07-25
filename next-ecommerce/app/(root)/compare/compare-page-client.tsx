'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CompareTable from '@/components/shared/compare/compare-table'
import useCompareStore from '@/hooks/use-compare-store'
import { getProductsByIds } from '@/lib/actions/product.actions'
import type { StoreProduct } from '@/lib/catalog/store-product'

export default function ComparePageClient() {
  const { items, remove, clear } = useCompareStore()
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (items.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    void getProductsByIds(items.map((item) => item.id)).then((rows) => {
      if (cancelled) return
      const byId = new Map(rows.map((p) => [p._id, p]))
      // Keep compare order; drop ids that no longer resolve
      const ordered = items
        .map((item) => byId.get(item.id))
        .filter((p): p is StoreProduct => Boolean(p))
      setProducts(ordered)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [items])

  if (loading) {
    return (
      <p className='text-sm text-muted-foreground'>Loading comparison…</p>
    )
  }

  if (products.length === 0) {
    return (
      <div className='space-y-4 rounded-lg border border-dashed p-8 text-center'>
        <p className='text-muted-foreground'>
          Add 2–4 products from search or product pages to compare them side by
          side.
        </p>
        <Button asChild>
          <Link href='/search'>Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm text-muted-foreground'>
          Comparing {products.length} product{products.length === 1 ? '' : 's'}
          {products.length < 2
            ? ' — add at least one more for a useful comparison.'
            : ''}
        </p>
        <Button type='button' variant='outline' size='sm' onClick={clear}>
          Clear all
        </Button>
      </div>
      <CompareTable products={products} onRemove={remove} />
    </div>
  )
}
