'use client'

import Image from 'next/image'
import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  removeSellerProductImage,
  replaceSellerProductImage,
} from '@/lib/actions/upload.actions'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export default function SellerProductImageForm({
  productId,
  imageUrl,
}: {
  productId: string
  imageUrl?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='relative h-14 w-14 overflow-hidden rounded-md border bg-muted'>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt='Product'
            fill
            className='object-cover'
            unoptimized={shouldUnoptimizeProductImage(imageUrl)}
          />
        ) : (
          <span className='flex h-full items-center justify-center text-[10px] text-muted-foreground'>
            No img
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
            const result = await replaceSellerProductImage(
              productId,
              body,
              imageUrl
            )
            if (!result.success) {
              toast.error(result.message)
              return
            }
            toast.success('Product image updated')
            router.refresh()
          })
        }}
      />
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? 'Working…' : 'Change image'}
      </Button>
      {imageUrl ? (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Remove this product image?')) return
            startTransition(async () => {
              const result = await removeSellerProductImage(productId, imageUrl)
              if (!result.success) {
                toast.error(result.message)
                return
              }
              toast.success('Product image removed')
              router.refresh()
            })
          }}
        >
          Remove
        </Button>
      ) : null}
    </div>
  )
}
