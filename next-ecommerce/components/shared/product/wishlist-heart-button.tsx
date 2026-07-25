'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import {
  getWishlistStatus,
  toggleWishlistItem,
} from '@/lib/actions/wishlist.actions'
import { cn } from '@/lib/utils'

export default function WishlistHeartButton({
  productId,
  initialWishlisted,
  signedIn,
  className,
}: {
  productId: string
  initialWishlisted?: boolean
  /** When omitted, status is loaded on mount. */
  signedIn?: boolean
  className?: string
}) {
  const router = useRouter()
  const [wishlisted, setWishlisted] = useState(Boolean(initialWishlisted))
  const [isSignedIn, setIsSignedIn] = useState(signedIn)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setWishlisted(Boolean(initialWishlisted))
  }, [initialWishlisted])

  useEffect(() => {
    if (signedIn !== undefined) {
      setIsSignedIn(signedIn)
      return
    }
    let cancelled = false
    void getWishlistStatus(productId).then((status) => {
      if (cancelled) return
      setIsSignedIn(status.signedIn)
      setWishlisted(status.wishlisted)
    })
    return () => {
      cancelled = true
    }
  }, [productId, signedIn])

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isSignedIn) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`
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
    <button
      type='button'
      aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={wishlisted}
      disabled={pending}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full border border-slate-900/10 bg-white/95 text-chrome shadow-sm transition hover:border-deal hover:text-deal disabled:opacity-60',
        className
      )}
    >
      <Heart
        className={cn(
          'size-4',
          wishlisted ? 'fill-destructive text-destructive' : ''
        )}
      />
    </button>
  )
}
