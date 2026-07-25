'use client'

import Image from 'next/image'
import { useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateSellerProduct } from '@/lib/actions/seller.actions'
import { uploadSellerProductImage } from '@/lib/actions/upload.actions'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export default function SellerProductImageForm({
  productId,
  imageUrl,
}: {
  productId: string
  imageUrl?: string
}) {
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
            const uploaded = await uploadSellerProductImage(body)
            if (!uploaded.success) {
              toast.error(uploaded.message)
              return
            }
            const result = await updateSellerProduct(productId, {
              images: [uploaded.url],
            })
            if (!result.success) {
              toast.error(result.message || 'Could not update image')
              return
            }
            toast.success('Product image updated')
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
        {pending ? 'Uploading…' : 'Change image'}
      </Button>
    </div>
  )
}
