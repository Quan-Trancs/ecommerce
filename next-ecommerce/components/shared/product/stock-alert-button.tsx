'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { toggleStockAlert } from '@/lib/actions/stock-alert.actions'
import { cn } from '@/lib/utils'

export default function StockAlertButton({
  productId,
  initialSubscribed,
  signedIn,
  className,
}: {
  productId: string
  initialSubscribed: boolean
  signedIn: boolean
  className?: string
}) {
  const router = useRouter()
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!signedIn) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      )
      return
    }
    startTransition(async () => {
      const result = await toggleStockAlert(productId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      setSubscribed(Boolean(result.subscribed))
      toast.success(result.message)
      router.refresh()
    })
  }

  return (
    <Button
      type='button'
      variant='outline'
      className={cn('w-full', className)}
      disabled={pending}
      onClick={onClick}
      aria-pressed={subscribed}
    >
      {subscribed ? (
        <BellOff className='mr-2 size-4' />
      ) : (
        <Bell className='mr-2 size-4' />
      )}
      {subscribed ? 'Cancel stock alert' : 'Notify me when available'}
    </Button>
  )
}
