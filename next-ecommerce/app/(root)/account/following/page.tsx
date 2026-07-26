import Image from 'next/image'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/require-role'
import { getMyFollowedShops } from '@/lib/actions/shop-follow.actions'
import { formatDateTime } from '@/lib/utils'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export const metadata = { title: 'Following' }

export default async function FollowingShopsPage() {
  await requireSession()
  const shops = await getMyFollowedShops()

  return (
    <div className='page-shell space-y-6 px-4 py-8 md:px-6'>
      <div>
        <p className='text-sm text-muted-foreground'>
          <Link href='/account' className='hover:text-foreground'>
            Your Account
          </Link>
          <span className='mx-2'>/</span>
          Following
        </p>
        <h1 className='mt-2 font-display text-3xl font-extrabold tracking-tight'>
          Following
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Shops you follow. New listings can email you — manage that in{' '}
          <Link href='/account/settings' className='underline'>
            notification settings
          </Link>
          .
        </p>
      </div>

      {shops.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          You are not following any shops yet. Open a seller shop and tap{' '}
          <span className='font-medium'>Follow shop</span>.
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {shops.map((shop) => (
            <li
              key={shop.sellerAccountId}
              className='flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex min-w-0 items-start gap-3'>
                {shop.shopLogoUrl ? (
                  <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted'>
                    <Image
                      src={shop.shopLogoUrl}
                      alt=''
                      fill
                      className='object-cover'
                      sizes='48px'
                      unoptimized={shouldUnoptimizeProductImage(
                        shop.shopLogoUrl
                      )}
                    />
                  </div>
                ) : null}
                <div className='min-w-0 space-y-1'>
                  <Link
                    href={`/shop/${shop.shopSlug}`}
                    className='font-medium hover:text-primary hover:underline'
                  >
                    {shop.shopName}
                    {shop.verified ? (
                      <span className='ml-2 text-xs font-medium text-emerald-700'>
                        Verified
                      </span>
                    ) : null}
                  </Link>
                  {shop.bio ? (
                    <p className='line-clamp-2 text-sm text-muted-foreground'>
                      {shop.bio}
                    </p>
                  ) : null}
                  <p className='text-xs text-muted-foreground'>
                    {shop.productCount} product
                    {shop.productCount === 1 ? '' : 's'} · Followed{' '}
                    {formatDateTime(new Date(shop.followedAt)).dateTime}
                  </p>
                </div>
              </div>
              <Link
                href={`/shop/${shop.shopSlug}`}
                className='text-sm text-primary underline'
              >
                Visit shop
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
