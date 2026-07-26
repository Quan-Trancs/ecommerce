'use client'

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateMySellerShop } from '@/lib/actions/shop.actions'
import { toSlug } from '@/lib/utils'

export default function SellerShopProfileForm({
  accountId,
  shopSlug,
  shopName,
  bio,
}: {
  accountId: string
  shopSlug: string
  shopName: string
  bio: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(shopName)
  const [slug, setSlug] = useState(shopSlug)
  const [bioText, setBioText] = useState(bio || '')
  const previewSlug = toSlug(slug) || shopSlug

  return (
    <form
      className='space-y-3 rounded-lg border p-4'
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await updateMySellerShop({
            shopName: name,
            shopSlug: slug,
            bio: bioText,
          })
          if (result.success) {
            toast.success(result.message)
            if (result.shop?.shopSlug) setSlug(result.shop.shopSlug)
            router.refresh()
          } else {
            toast.error(result.message)
          }
        })
      }}
    >
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <p className='text-sm font-medium'>Public shop</p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Shown on your storefront at{' '}
            <Link
              href={`/shop/${previewSlug}`}
              className='underline hover:text-primary'
            >
              /shop/{previewSlug}
            </Link>
          </p>
        </div>
        <Link
          href={`/shop/${shopSlug || accountId}`}
          className='text-sm text-primary underline'
        >
          View shop
        </Link>
      </div>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Shop name</span>
        <input
          className='w-full rounded-md border bg-background px-3 py-2'
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
          disabled={pending}
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>URL slug</span>
        <div className='flex items-center gap-2'>
          <span className='shrink-0 text-muted-foreground'>/shop/</span>
          <input
            className='w-full rounded-md border bg-background px-3 py-2 font-mono text-sm'
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={120}
            required
            disabled={pending}
            pattern='[a-z0-9]+(-[a-z0-9]+)*'
            title='Lowercase letters, numbers, and hyphens'
          />
        </div>
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Bio (optional)</span>
        <textarea
          className='min-h-[72px] w-full rounded-md border bg-background px-3 py-2'
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          maxLength={500}
          disabled={pending}
        />
      </label>
      <Button type='submit' size='sm' disabled={pending}>
        {pending ? 'Saving…' : 'Save shop profile'}
      </Button>
    </form>
  )
}
