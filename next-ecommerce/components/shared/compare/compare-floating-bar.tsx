'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useCompareStore, { COMPARE_MAX } from '@/hooks/use-compare-store'
import ProductPrice from '@/components/shared/product/product-price'
import useIsMounted from '@/hooks/use-is-mounted'

export default function CompareFloatingBar() {
  const pathname = usePathname()
  const mounted = useIsMounted()
  const { items, remove, clear } = useCompareStore()

  if (!mounted || items.length === 0 || pathname === '/compare') {
    return null
  }

  return (
    <div className='fixed inset-x-0 bottom-0 z-40 border-t border-slate-900/10 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur'>
      <div className='page-shell flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6'>
        <div className='flex min-w-0 flex-1 items-center gap-3 overflow-x-auto'>
          <p className='shrink-0 text-sm font-semibold text-chrome'>
            Compare ({items.length}/{COMPARE_MAX})
          </p>
          {items.map((item) => (
            <div
              key={item.id}
              className='relative flex shrink-0 items-center gap-2 rounded-md border border-slate-900/10 bg-white px-2 py-1.5'
            >
              <div className='relative size-10 overflow-hidden rounded bg-slate-50'>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes='40px'
                  className='object-contain p-0.5'
                />
              </div>
              <div className='max-w-[8rem]'>
                <p className='truncate text-xs font-medium'>{item.name}</p>
                <ProductPrice price={item.price} plain />
              </div>
              <button
                type='button'
                aria-label={`Remove ${item.name} from compare`}
                className='rounded p-0.5 text-muted-foreground hover:text-chrome'
                onClick={() => remove(item.id)}
              >
                <X className='size-3.5' />
              </button>
            </div>
          ))}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <Button type='button' variant='ghost' size='sm' onClick={clear}>
            Clear
          </Button>
          {items.length >= 2 ? (
            <Button type='button' size='sm' asChild>
              <Link href='/compare'>Compare</Link>
            </Button>
          ) : (
            <Button type='button' size='sm' disabled>
              Compare
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
