'use client'

import { Columns2 } from 'lucide-react'
import { toast } from 'sonner'
import useCompareStore, { type CompareItem } from '@/hooks/use-compare-store'
import { cn } from '@/lib/utils'

export default function CompareToggleButton({
  item,
  className,
}: {
  item: CompareItem
  className?: string
}) {
  const { isCompared, toggle } = useCompareStore()
  const active = isCompared(item.id)

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const result = toggle(item)
    if (result.full) {
      toast.error('Compare list is full (max 4). Remove a product first.')
      return
    }
    toast.success(result.added ? 'Added to compare' : 'Removed from compare')
  }

  return (
    <button
      type='button'
      aria-label={active ? 'Remove from compare' : 'Add to compare'}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-slate-900/10 bg-white/95 text-chrome shadow-sm transition hover:border-deal hover:text-deal',
        active && 'border-deal text-deal',
        className
      )}
    >
      <Columns2 className='size-4' />
    </button>
  )
}
