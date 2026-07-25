'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Columns2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import useCompareStore, { type CompareItem } from '@/hooks/use-compare-store'
import { cn } from '@/lib/utils'

export default function CompareAddButton({
  item,
  className,
}: {
  item: CompareItem
  className?: string
}) {
  const router = useRouter()
  const { isCompared, toggle } = useCompareStore()
  const active = isCompared(item.id)

  function onClick() {
    const result = toggle(item)
    if (result.full) {
      toast.error('Compare list is full (max 4). Remove a product first.')
      return
    }
    toast.success(result.added ? 'Added to compare' : 'Removed from compare', {
      action: result.added
        ? {
            label: 'Compare',
            onClick: () => router.push('/compare'),
          }
        : undefined,
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        onClick={onClick}
        aria-pressed={active}
      >
        <Columns2 className={cn('mr-2 size-4', active && 'text-deal')} />
        {active ? 'In compare' : 'Compare'}
      </Button>
      {active ? (
        <p className='text-center text-xs text-muted-foreground'>
          <Link href='/compare' className='underline'>
            View comparison
          </Link>
        </p>
      ) : null}
    </div>
  )
}
