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

  const { addItem } = useCartStore()

  const [quantity, setQuantity] = useState(1)

  return minimal ? (
    <Button
      className='rounded-full w-auto'
      onClick={() => {
        try {
          addItem(item, 1)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          toast.error('', {
            description: error.message,
          })
        }
      }}
    >
      Add to cart
    </Button>
  ) : (
    <div className='space-y-2 w-full'>
      <Select
        value={quantity.toString()}
        onValueChange={(value) => setQuantity(Number(value))}
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
          try {
            const itemId = await addItem(item, quantity)
            router.push(`/cart/${itemId}`)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            toast.error('', {
              description: error.message,
            })
          }
        }}
      >
        Add to cart
      </Button>
      <Button
        variant='secondary'
        className='rounded-full w-full'
        onClick={async () => {
          try {
            addItem(item, quantity)
            router.push('/checkout')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            toast.error('', {
              description: error.message,
            })
          }
        }}
      >
        Buy now
      </Button>
    </div>
  )
}
