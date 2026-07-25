'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleWishlistItem } from '@/lib/actions/wishlist.actions'
import { cn } from '@/lib/utils'

export default function WishlistToggleButton({
  productId,
  initialWishlisted,
  signedIn,
  className,
}: {
  productId: string
  initialWishlisted: boolean
  signedIn: boolean
  className?: string
}) {
  const router = useRouter()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!signedIn) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      )
      return
    }
    startTransition(async () => {
      const result = await toggleWishlistItem(productId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      setWishlisted(Boolean(result.wishlisted))
      toast.success(result.message, {
        action: result.wishlisted
          ? {
              label: 'View',
              onClick: () => router.push('/account/wishlist'),
            }
          : undefined,
      })
      router.refresh()
    })
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={pending}
        onClick={onClick}
        aria-pressed={wishlisted}
      >
        <Heart
          className={cn(
            'mr-2 size-4',
            wishlisted ? 'fill-destructive text-destructive' : ''
          )}
        />
        {wishlisted ? 'Saved' : 'Save for later'}
      </Button>
      {wishlisted ? (
        <p className='text-center text-xs text-muted-foreground'>
          <Link href='/account/wishlist' className='underline'>
            View wishlist
          </Link>
        </p>
      ) : null}
    </div>
  )
}
