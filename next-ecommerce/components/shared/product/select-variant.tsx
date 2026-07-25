import { IProduct } from '@/lib/catalog/store-product'
import Link from 'next/link'
import { colorSwatch, isLightSwatch } from '@/lib/search/filter-utils'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SelectVariant({
  product,
  size,
  color,
}: {
  product: IProduct
  size: string
  color: string
}) {
  const variantColors = [
    ...new Set(
      (product.variants || [])
        .map((v) => v.color)
        .filter((c): c is string => Boolean(c))
    ),
  ]
  const colors = variantColors.length ? variantColors : product.colors

  const selectedColor = color || colors[0] || ''
  const sizesForColor = [
    ...new Set(
      (product.variants || [])
        .filter((v) => !selectedColor || v.color === selectedColor)
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s))
    ),
  ]
  const sizes = sizesForColor.length ? sizesForColor : product.sizes
  const selectedSize = size || sizes[0] || ''

  const selectedVariant = product.variants?.find(
    (v) =>
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
  )

  return (
    <div className='space-y-4'>
      {colors.length > 0 && (
        <div className='space-y-2'>
          <p className='filter-section-title'>Color</p>
          <div className='flex flex-wrap gap-2.5'>
            {colors.map((x: string) => {
              const selected = selectedColor === x
              const swatch = x.startsWith('#') ? x : colorSwatch(x)
              const light = isLightSwatch(x) || x.toLowerCase() === '#ffffff'
              return (
                <Link
                  key={x}
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: x,
                    size: selectedSize,
                  })}`}
                  title={x}
                  className='flex w-14 flex-col items-center gap-1'
                >
                  <span
                    className='filter-swatch relative flex items-center justify-center'
                    data-selected={selected || undefined}
                    style={{ background: swatch }}
                  >
                    {selected && (
                      <Check
                        className={cn(
                          'h-3.5 w-3.5',
                          light ? 'text-chrome' : 'text-white'
                        )}
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span className='w-full truncate text-center font-mono text-[9px] uppercase tracking-wide text-slate-500'>
                    {x}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className='space-y-2'>
          <p className='filter-section-title'>Size</p>
          <div className='flex flex-wrap gap-1.5'>
            {sizes.map((x: string) => {
              const selected = selectedSize === x
              const variant = product.variants?.find(
                (v) =>
                  (!selectedColor || v.color === selectedColor) &&
                  v.size === x
              )
              const out = variant && variant.stockQuantity <= 0
              return (
                <Link
                  key={x}
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: selectedColor,
                    size: x,
                  })}`}
                  className={cn(
                    'filter-size',
                    out && 'opacity-40 line-through'
                  )}
                  data-selected={selected || undefined}
                >
                  {x}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {selectedVariant && (
        <p className='font-mono text-[11px] uppercase tracking-wider text-slate-500'>
          SKU {selectedVariant.sku || selectedVariant.id} ·{' '}
          {selectedVariant.stockQuantity} in stock · $
          {selectedVariant.price.toFixed(2)}
        </p>
      )}
    </div>
  )
}
