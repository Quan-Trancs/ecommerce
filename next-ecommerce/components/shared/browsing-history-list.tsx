'use client'

import { useEffect, useState } from 'react'
import ProductSlider from './product/product-slider'
import useBrowsingHistory from '@/hooks/use-browsing-history'
import useIsMounted from '@/hooks/use-is-mounted'
import type { IProduct } from '@/lib/catalog/store-product'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function BrowsingHistoryList({
  className,
  excludeId,
  showRelated = true,
}: {
  className?: string
  /** Hide this product (e.g. current PDP) from the recently viewed strip. */
  excludeId?: string
  showRelated?: boolean
}) {
  const mounted = useIsMounted()
  const { products, clear } = useBrowsingHistory()

  if (!mounted || products.length === 0) return null

  const idsForFetch = excludeId
    ? products.filter((p) => p.id !== excludeId)
    : products

  if (idsForFetch.length === 0) return null

  return (
    <div className={cn('space-y-8', className)}>
      <ProductList
        title='Recently viewed'
        type='history'
        excludeId={excludeId}
        action={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground'
            onClick={clear}
          >
            Clear
          </Button>
        }
      />
      {showRelated ? (
        <ProductList
          title="Related to items you've viewed"
          type='related'
          excludeId={excludeId}
        />
      ) : null}
    </div>
  )
}

function ProductList({
  title,
  type = 'history',
  excludeId,
  action,
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  action?: React.ReactNode
}) {
  const { products } = useBrowsingHistory()
  const [data, setData] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = products
      .filter((p) => !excludeId || p.id !== excludeId)
      .map((p) => p.id)
    const categories = products
      .filter((p) => !excludeId || p.id !== excludeId)
      .map((p) => p.category)

    if (ids.length === 0) {
      setData([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void fetch(
      `/api/products/browsing-history?type=${type}&categories=${encodeURIComponent(
        categories.join(',')
      )}&ids=${encodeURIComponent(ids.join(','))}`
    )
      .then(async (res) => {
        const json = await res.json()
        if (cancelled) return
        if (!Array.isArray(json)) {
          setData([])
          return
        }
        const rows = json as IProduct[]
        setData(
          excludeId ? rows.filter((p) => p._id !== excludeId) : rows
        )
      })
      .catch(() => {
        if (!cancelled) setData([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [products, type, excludeId])

  if (loading || data.length === 0) return null

  return <ProductSlider title={title} products={data} action={action} />
}
