'use client'

import Image from 'next/image'
import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { removeMyShopLogo, replaceMyShopLogo } from '@/lib/actions/shop.actions'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export default function SellerShopLogoForm({
  shopLogoUrl,
}: {
  shopLogoUrl: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className='space-y-2 rounded-lg border p-4'>
      <div>
        <p className='text-sm font-medium'>Shop logo</p>
        <p className='mt-1 text-sm text-muted-foreground'>
          Square avatar shown beside your shop name (JPEG, PNG, WebP, or GIF,
          max 5MB).
        </p>
      </div>
      <div className='relative h-20 w-20 overflow-hidden rounded-md border bg-muted'>
        {shopLogoUrl ? (
          <Image
            src={shopLogoUrl}
            alt='Shop logo'
            fill
            className='object-cover'
            unoptimized={shouldUnoptimizeProductImage(shopLogoUrl)}
          />
        ) : (
          <span className='flex h-full items-center justify-center text-[10px] text-muted-foreground'>
            No logo
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
            const result = await replaceMyShopLogo(body, shopLogoUrl)
            if (!result.success) {
              toast.error(result.message)
              return
            }
            toast.success('Shop logo updated')
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
          {pending ? 'Working…' : shopLogoUrl ? 'Change logo' : 'Upload logo'}
        </Button>
        {shopLogoUrl ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={pending}
            onClick={() => {
              if (!window.confirm('Remove this shop logo?')) return
              startTransition(async () => {
                const result = await removeMyShopLogo(shopLogoUrl)
                if (!result.success) {
                  toast.error(result.message)
                  return
                }
                toast.success('Shop logo removed')
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
