import { IProduct } from '@/lib/db/models/product.model'
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
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  return (
    <div className='space-y-4'>
      {product.colors.length > 0 && (
        <div className='space-y-2'>
          <p className='filter-section-title'>Color</p>
          <div className='flex flex-wrap gap-2.5'>
            {product.colors.map((x: string) => {
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

      {product.sizes.length > 0 && (
        <div className='space-y-2'>
          <p className='filter-section-title'>Size</p>
          <div className='flex flex-wrap gap-1.5'>
            {product.sizes.map((x: string) => {
              const selected = selectedSize === x
              return (
                <Link
                  key={x}
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: selectedColor,
                    size: x,
                  })}`}
                  className='filter-size'
                  data-selected={selected || undefined}
                >
                  {x}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
