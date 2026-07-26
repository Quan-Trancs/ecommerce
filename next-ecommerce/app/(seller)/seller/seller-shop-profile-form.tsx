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
  websiteUrl,
  instagramUrl,
  xUrl,
  shippingPolicy,
  returnsPolicy,
}: {
  accountId: string
  shopSlug: string
  shopName: string
  bio: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  xUrl: string | null
  shippingPolicy: string | null
  returnsPolicy: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(shopName)
  const [slug, setSlug] = useState(shopSlug)
  const [bioText, setBioText] = useState(bio || '')
  const [website, setWebsite] = useState(websiteUrl || '')
  const [instagram, setInstagram] = useState(instagramUrl || '')
  const [x, setX] = useState(xUrl || '')
  const [shipping, setShipping] = useState(shippingPolicy || '')
  const [returns, setReturns] = useState(returnsPolicy || '')
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
            websiteUrl: website,
            instagramUrl: instagram,
            xUrl: x,
            shippingPolicy: shipping,
            returnsPolicy: returns,
          })
          if (result.success) {
            toast.success(result.message)
            if (result.shop?.shopSlug) setSlug(result.shop.shopSlug)
            if (result.shop) {
              setWebsite(result.shop.websiteUrl || '')
              setInstagram(result.shop.instagramUrl || '')
              setX(result.shop.xUrl || '')
              setShipping(result.shop.shippingPolicy || '')
              setReturns(result.shop.returnsPolicy || '')
            }
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
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Website (optional)</span>
        <input
          className='w-full rounded-md border bg-background px-3 py-2'
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          maxLength={500}
          placeholder='https://example.com'
          disabled={pending}
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Instagram (optional)</span>
        <input
          className='w-full rounded-md border bg-background px-3 py-2'
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          maxLength={500}
          placeholder='@handle or profile URL'
          disabled={pending}
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>X (optional)</span>
        <input
          className='w-full rounded-md border bg-background px-3 py-2'
          value={x}
          onChange={(e) => setX(e.target.value)}
          maxLength={500}
          placeholder='@handle or profile URL'
          disabled={pending}
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Shipping policy (optional)</span>
        <textarea
          className='min-h-[88px] w-full rounded-md border bg-background px-3 py-2'
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
          maxLength={2000}
          placeholder='Processing times, carriers, regions…'
          disabled={pending}
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span className='text-muted-foreground'>Returns policy (optional)</span>
        <textarea
          className='min-h-[88px] w-full rounded-md border bg-background px-3 py-2'
          value={returns}
          onChange={(e) => setReturns(e.target.value)}
          maxLength={2000}
          placeholder='Return window, condition, how to start a return…'
          disabled={pending}
        />
      </label>
      <Button type='submit' size='sm' disabled={pending}>
        {pending ? 'Saving…' : 'Save shop profile'}
      </Button>
    </form>
  )
}
