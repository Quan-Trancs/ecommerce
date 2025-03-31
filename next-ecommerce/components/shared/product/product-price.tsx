'use client'

import { cn, formatCurrency } from '@/lib/utils'

const ProductPrice = ({
  price,
  isDeal = false,
  className,
  listPrice = 0,
  forListing = true,
  plain = false,
}: {
  price: number
  isDeal?: boolean
  className?: string
  listPrice?: number
  forListing?: boolean
  plain?: boolean
}) => {
  const discountPercent = Math.round(100 - (price / listPrice) * 100)
  const stringValue = price.toString()
  const [intValue, floatValue] = stringValue.includes('.')
    ? stringValue.split('.')
    : [stringValue, '']

  return plain ? (
    formatCurrency(price)
  ) : listPrice == 0 ? (
    <div className={cn('text-3xl', className)}>
      <span className='text-xs allign-super'>$</span>
      {intValue}
      <span className='text-xs allign-super'>{floatValue}</span>
    </div>
  ) : isDeal ? (
    <div className='space-y-2'>
      <div className='flex items-center justify-center gap-2'>
        <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
          {discountPercent}% off
        </span>
        <span className='text-red-700 text-xs font-bold'>
          Limited time deal
        </span>
      </div>
      <div
        className={`flex ${forListing && 'justify-center'} items-center gap-2`}
      >
        <div className={cn('text-3xl', className)}>
          <span className='text-xs allign-super'>$</span>
          {intValue}
          <span className='text-xs allign-super'>{floatValue}</span>
        </div>
        <div className='text-muted-foreground text-xs py-2'>
          Was: <span className='line-through'>{formatCurrency(listPrice)}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className=''>
      <div className='flex justify-center gap-3'>
        <div className='text-orange-700 text-3xl'>-{discountPercent}%</div>
        <div className={cn('text-3xl', className)}>
          <span className='text-xs allign-super'>$</span>
          {intValue}
          <span className='text-xs allign-super'>{floatValue}</span>
        </div>
      </div>
      <div className='text-muted-foreground text-xs py-2'>
        List Price:{' '}
        <span className='line-through'>{formatCurrency(listPrice)}</span>
      </div>
    </div>
  )
}

export default ProductPrice
