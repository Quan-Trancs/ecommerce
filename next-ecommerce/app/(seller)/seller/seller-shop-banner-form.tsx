'use client'

import Image from 'next/image'
import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  removeMyShopBanner,
  replaceMyShopBanner,
} from '@/lib/actions/shop.actions'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export default function SellerShopBannerForm({
  shopBannerUrl,
}: {
  shopBannerUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className='space-y-2 rounded-lg border p-4'>
      <div>
        <p className='text-sm font-medium'>Shop banner</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Wide cover image on your public shop page (JPEG, PNG, WebP, or GIF,
          max 5MB).
        </p>
      </div>
      <div className='relative h-28 w-full overflow-hidden rounded-md border bg-muted md:h-36'>
        {shopBannerUrl ? (
          <Image
            src={shopBannerUrl}
            alt='Shop banner'
            fill
            className='object-cover'
            unoptimized={shouldUnoptimizeProductImage(shopBannerUrl)}
          />
        ) : (
          <span className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            No banner yet
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          const body = new FormData()
          body.set('file', file)
          startTransition(async () => {
            const result = await replaceMyShopBanner(body, shopBannerUrl)
            if (!result.success) {
              toast.error(result.message)
              return
            }
            toast.success('Shop banner updated')
            router.refresh()
          })
        }}
      />
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? 'Working…' : shopBannerUrl ? 'Change banner' : 'Upload banner'}
        </Button>
        {shopBannerUrl ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={pending}
            onClick={() => {
              if (!window.confirm('Remove this shop banner?')) return
              startTransition(async () => {
                const result = await removeMyShopBanner(shopBannerUrl)
                if (!result.success) {
                  toast.error(result.message)
                  return
                }
                toast.success('Shop banner removed')
                router.refresh()
              })
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )
}
