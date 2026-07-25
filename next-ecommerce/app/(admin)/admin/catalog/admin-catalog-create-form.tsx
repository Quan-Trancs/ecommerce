'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createAdminCatalogProduct } from '@/lib/actions/admin.actions'

export default function AdminCatalogCreateForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('29.99')
  const [stock, setStock] = useState('25')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  return (
    <form
      className='max-w-lg space-y-3 rounded-lg border p-4'
      onSubmit={(e) => {
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
          const result = await createAdminCatalogProduct({
            name: name.trim(),
            price: Math.round(parsedPrice * 100) / 100,
            stockQuantity: Math.floor(parsedStock),
            description: description.trim(),
            imageUrl: imageUrl.trim() || undefined,
            isPublished,
          })
          if (!result.success) {
            toast.error(result.message || 'Create failed')
            return
          }
          toast.success('Platform product created')
          setName('')
          setDescription('')
          setImageUrl('')
          router.refresh()
        })
      }}
    >
      <h3 className='font-semibold'>New platform product</h3>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder='Name'
        required
      />
      <div className='grid grid-cols-2 gap-2'>
        <Input
          type='number'
          min='0'
          step='0.01'
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder='Price'
          required
        />
        <Input
          type='number'
          min='0'
          step='1'
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder='Stock'
          required
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className='flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
        placeholder='Description'
      />
      <Input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder='Image URL (optional)'
      />
      <label className='flex items-center gap-2 text-sm'>
        <input
          type='checkbox'
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        Published
      </label>
      <Button type='submit' disabled={pending}>
        {pending ? 'Creating…' : 'Create product'}
      </Button>
    </form>
  )
}
