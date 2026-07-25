'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ProductPrice from '@/components/shared/product/product-price'
import Rating from '@/components/shared/product/rating'
import AddToCart from '@/components/shared/product/add-to-cart'
import type { StoreProduct } from '@/lib/catalog/store-product'
import { facetLabel } from '@/lib/search/filter-utils'
import { generateId, roundToTwoDecimals } from '@/lib/utils'

function joinValues(values?: string[]) {
  if (!values?.length) return '—'
  return values.join(', ')
}

export default function CompareTable({
  products,
  onRemove,
}: {
  products: StoreProduct[]
  onRemove: (id: string) => void
}) {
  const attrKeys = Array.from(
    new Set(
      products.flatMap((p) => Object.keys(p.attributes || {})).filter(Boolean)
    )
  ).sort()

  const rows: { label: string; values: string[] }[] = [
    {
      label: 'Brand',
      values: products.map((p) => p.brand || '—'),
    },
    {
      label: 'Price',
      values: products.map((p) => `$${roundToTwoDecimals(p.price).toFixed(2)}`),
    },
    {
      label: 'List price',
      values: products.map((p) =>
        p.listPrice > p.price
          ? `$${roundToTwoDecimals(p.listPrice).toFixed(2)}`
          : '—'
      ),
    },
    {
      label: 'Rating',
      values: products.map((p) =>
        p.numReviews > 0
          ? `${p.avgRating.toFixed(1)} (${p.numReviews})`
          : 'No reviews'
      ),
    },
    {
      label: 'Availability',
      values: products.map((p) =>
        p.countInStock > 0 ? `In stock (${p.countInStock})` : 'Out of stock'
      ),
    },
    {
      label: 'Category',
      values: products.map((p) => p.category || '—'),
    },
    {
      label: 'Colors',
      values: products.map((p) => joinValues(p.colors)),
    },
    {
      label: 'Sizes',
      values: products.map((p) => joinValues(p.sizes)),
    },
    ...attrKeys
      .filter((key) => key !== 'color' && key !== 'size')
      .map((key) => ({
        label: facetLabel(key),
        values: products.map((p) => joinValues(p.attributes?.[key])),
      })),
  ]

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[40rem] border-collapse text-sm'>
        <thead>
          <tr>
            <th className='sticky left-0 z-10 w-36 bg-background p-3 text-left font-medium text-muted-foreground'>
              Spec
            </th>
            {products.map((product) => (
              <th
                key={product._id}
                className='min-w-[12rem] p-3 text-left align-top font-normal'
              >
                <div className='space-y-3'>
                  <Link
                    href={`/product/${product.slug}`}
                    className='relative block aspect-square overflow-hidden rounded-md bg-slate-50'
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes='200px'
                      className='object-contain p-3'
                    />
                  </Link>
                  <Link
                    href={`/product/${product.slug}`}
                    className='line-clamp-2 font-semibold hover:text-deal'
                  >
                    {product.name}
                  </Link>
                  <div className='flex items-center gap-2'>
                    <Rating rating={product.avgRating} />
                  </div>
                  <ProductPrice
                    price={product.price}
                    listPrice={product.listPrice}
                    forListing
                  />
                  {product.countInStock > 0 ? (
                    <AddToCart
                      minimal
                      item={{
                        clientId: generateId(),
                        product: product._id,
                        size: product.sizes[0] || 'Standard',
                        color: product.colors[0] || 'Default',
                        countInStock: product.countInStock,
                        name: product.name,
                        slug: product.slug,
                        category: product.category,
                        quantity: 1,
                        image: product.images[0],
                        price: roundToTwoDecimals(product.price),
                      }}
                    />
                  ) : null}
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0'
                    onClick={() => onRemove(product._id)}
                  >
                    Remove
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className='border-t border-slate-900/10'>
              <th className='sticky left-0 z-10 bg-background p-3 text-left font-medium text-muted-foreground'>
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${products[index]?._id}`} className='p-3'>
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
