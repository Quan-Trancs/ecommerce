'use client'

import { Button } from '@/components/ui/custom/custom-button'
import { Select } from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { OrderItem } from '@/types'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem
  minimal?: boolean
}) {
  const router = useRouter()
  const { addItem, isUpdating } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async (qty: number) => {
    if (isUpdating || isLoading) {
      toast.error('Cart is being updated, please wait')
      return
    }

    setIsLoading(true)
    try {
      await addItem(item, qty)
      toast('', {
        description: 'Added to cart',
        action: (
          <Button
            onClick={() => {
              router.push('/cart')
            }}
          >
            Go to cart
          </Button>
        ),
      })
    } catch (error: any) {
      toast.error('', {
        description: error.message || 'Failed to add item to cart',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = async (qty: number) => {
    if (isUpdating || isLoading) {
      toast.error('Cart is being updated, please wait')
      return
    }

    setIsLoading(true)
    try {
      await addItem(item, qty)
      router.push('/checkout')
    } catch (error: any) {
      toast.error('', {
        description: error.message || 'Failed to add item to cart',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => handleAddToCart(1)}
      disabled={isLoading || isUpdating}
    >
      {isLoading ? 'Adding...' : 'Add to cart'}
    </Button>
  ) : (
    <div className='space-y-2 w-full'>
      <Select
        value={quantity.toString()}
        onValueChange={(value) => setQuantity(Number(value))}
        disabled={isLoading || isUpdating}
      >
        <SelectTrigger className=''>
          <SelectValue>Quantity: {quantity}</SelectValue>
        </SelectTrigger>
        <SelectContent position='popper'>
          {Array.from({ length: item.countInStock }).map((_, i) => (
            <SelectItem key={i + 1} value={`${i + 1}`}>
              {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className='rounded-full w-full'
        type='button'
        onClick={async () => {
          const itemId = await handleAddToCart(quantity)
          if (itemId) {
            router.push(`/cart/${itemId}`)
          }
        }}
        disabled={isLoading || isUpdating}
      >
        {isLoading ? 'Adding...' : 'Add to cart'}
      </Button>
      
      <Button
        variant='secondary'
        className='rounded-full w-full'
        onClick={() => handleBuyNow(quantity)}
        disabled={isLoading || isUpdating}
      >
        {isLoading ? 'Processing...' : 'Buy now'}
      </Button>
    </div>
  )
}
