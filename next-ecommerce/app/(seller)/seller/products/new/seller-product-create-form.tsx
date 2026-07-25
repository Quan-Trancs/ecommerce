'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSellerProduct } from '@/lib/actions/seller.actions'

export default function SellerProductCreateForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('19.99')
  const [stock, setStock] = useState('10')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedPrice = Number(price)
    const parsedStock = Number(stock)
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Enter a valid price')
      return
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      toast.error('Enter a valid stock quantity')
      return
    }

    startTransition(async () => {
      const result = await createSellerProduct({
        name: name.trim(),
        price: Math.round(parsedPrice * 100) / 100,
        stockQuantity: Math.floor(parsedStock),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        isPublished,
      })
      if (!result.success) {
        toast.error(result.message || 'Failed to create product')
        return
      }
      toast.success('Product created')
      router.push('/seller/products')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className='max-w-lg space-y-4'>
      <div className='space-y-1.5'>
        <label className='text-sm font-medium' htmlFor='name'>
          Name
        </label>
        <Input
          id='name'
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Product name'
          required
        />
      </div>
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <label className='text-sm font-medium' htmlFor='price'>
            Price
          </label>
          <Input
            id='price'
            type='number'
            min='0'
            step='0.01'
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className='space-y-1.5'>
          <label className='text-sm font-medium' htmlFor='stock'>
            Stock
          </label>
          <Input
            id='stock'
            type='number'
            min='0'
            step='1'
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
      </div>
      <div className='space-y-1.5'>
        <label className='text-sm font-medium' htmlFor='description'>
          Description
        </label>
        <textarea
          id='description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className='flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
          placeholder='Short product description'
        />
      </div>
      <div className='space-y-1.5'>
        <label className='text-sm font-medium' htmlFor='imageUrl'>
          Image URL (optional)
        </label>
        <Input
          id='imageUrl'
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder='https://...'
        />
      </div>
      <label className='flex items-center gap-2 text-sm'>
        <input
          type='checkbox'
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published (visible in catalog)
      </label>
      <div className='flex gap-2'>
        <Button type='submit' disabled={pending}>
          {pending ? 'Creating…' : 'Create product'}
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={pending}
          onClick={() => router.push('/seller/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
