'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleShopFollow } from '@/lib/actions/shop-follow.actions'
import { cn } from '@/lib/utils'

export default function ShopFollowButton({
  sellerAccountId,
  initialFollowing,
  signedIn,
  isOwnShop,
  className,
}: {
  sellerAccountId: string
  initialFollowing: boolean
  signedIn: boolean
  isOwnShop?: boolean
  className?: string
}) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()

  if (isOwnShop) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        This is your shop
      </p>
    )
  }

  function onClick() {
    if (!signedIn) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      )
      return
    }
    startTransition(async () => {
      const result = await toggleShopFollow(sellerAccountId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      setFollowing(Boolean(result.following))
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <Button
      type='button'
      variant={following ? 'secondary' : 'default'}
      size='sm'
      className={className}
      disabled={pending}
      onClick={onClick}
      aria-pressed={following}
    >
      {following ? (
        <UserCheck className='mr-2 size-4' />
      ) : (
        <UserPlus className='mr-2 size-4' />
      )}
      {following ? 'Following' : 'Follow shop'}
    </Button>
  )
}
