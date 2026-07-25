'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { removeFromWishlist } from '@/lib/actions/wishlist.actions'

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await removeFromWishlist(productId)
          if (result.success) {
            toast.success(result.message)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      Remove
    </Button>
  )
}
