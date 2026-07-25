'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateSellerProduct } from '@/lib/actions/seller.actions'

export default function SellerProductStockPriceForm({
  productId,
  price,
  stockQuantity,
}: {
  productId: string
  price: number
  stockQuantity: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [priceValue, setPriceValue] = useState(String(price))
  const [stockValue, setStockValue] = useState(String(stockQuantity))

  const onSave = () => {
    const nextPrice = Number(priceValue)
    const nextStock = Number(stockValue)
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Invalid price')
      return
    }
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      toast.error('Invalid stock')
      return
    }

    startTransition(async () => {
      const result = await updateSellerProduct(productId, {
        price: Math.round(nextPrice * 100) / 100,
        stockQuantity: Math.floor(nextStock),
      })
      if (!result.success) {
        toast.error(result.message || 'Update failed')
        return
      }
      toast.success('Product updated')
      router.refresh()
    })
  }

  return (
    <div className='flex flex-wrap items-end gap-2'>
      <div className='space-y-1'>
        <label className='text-[11px] uppercase tracking-wide text-muted-foreground'>
          Price
        </label>
        <Input
          type='number'
          min='0'
          step='0.01'
          className='h-8 w-24'
          value={priceValue}
          onChange={(e) => setPriceValue(e.target.value)}
          disabled={pending}
        />
      </div>
      <div className='space-y-1'>
        <label className='text-[11px] uppercase tracking-wide text-muted-foreground'>
          Stock
        </label>
        <Input
          type='number'
          min='0'
          step='1'
          className='h-8 w-20'
          value={stockValue}
          onChange={(e) => setStockValue(e.target.value)}
          disabled={pending}
        />
      </div>
      <Button type='button' size='sm' disabled={pending} onClick={onSave}>
        {pending ? '…' : 'Save'}
      </Button>
    </div>
  )
}
