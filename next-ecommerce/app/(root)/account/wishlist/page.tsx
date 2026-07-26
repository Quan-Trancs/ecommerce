import Image from 'next/image'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/require-role'
import { getMyWishlist } from '@/lib/actions/wishlist.actions'
import { getSellerShopsForProducts, shopHref } from '@/lib/actions/shop.actions'
import ProductPrice from '@/components/shared/product/product-price'
import { formatDateTime } from '@/lib/utils'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'
import { WishlistRemoveButton } from './wishlist-remove-button'

export const metadata = { title: 'Wishlist' }

export default async function WishlistPage() {
  await requireSession()
  const items = await getMyWishlist()
  const shopsBySellerId = await getSellerShopsForProducts(items)

  return (
    <div className='page-shell space-y-6 px-4 py-8 md:px-6'>
      <div>
        <p className='text-sm text-muted-foreground'>
          <Link href='/account' className='hover:text-foreground'>
            Your Account
          </Link>
          <span className='mx-2'>/</span>
          Wishlist
        </p>
        <h1 className='mt-2 font-display text-3xl font-extrabold tracking-tight'>
          Wishlist
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Products you saved for later. We can email you if the price drops —
          manage that in{' '}
          <Link href='/account/settings' className='underline'>
            notification settings
          </Link>
          .
        </p>
      </div>

      {items.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          Nothing saved yet.{' '}
          <Link href='/search' className='text-primary underline'>
            Browse the catalog
          </Link>
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {items.map((item) => {
            const href = item.slug
              ? `/product/${item.slug}`
              : `/search?q=${encodeURIComponent(item.productId)}`
            const shop = item.sellerAccountId
              ? shopsBySellerId[item.sellerAccountId]
              : undefined
            return (
              <li
                key={item.productId}
                className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='flex min-w-0 flex-1 gap-4'>
                  <Link
                    href={href}
                    className='relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted'
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name || 'Product'}
                        fill
                        className='object-cover'
                        sizes='80px'
                      />
                    ) : null}
                  </Link>
                  <div className='min-w-0 space-y-1'>
                    <Link
                      href={href}
                      className='font-medium leading-snug hover:text-primary hover:underline'
                    >
                      {item.name || 'Unavailable product'}
                    </Link>
                    {shop ? (
                      <Link
                        href={shopHref(shop)}
                        className='flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground'
                      >
                        {shop.shopLogoUrl ? (
                          <span className='relative h-4 w-4 shrink-0 overflow-hidden rounded-sm border bg-muted'>
                            <Image
                              src={shop.shopLogoUrl}
                              alt=''
                              fill
                              className='object-cover'
                              sizes='16px'
                              unoptimized={shouldUnoptimizeProductImage(
                                shop.shopLogoUrl
                              )}
                            />
                          </span>
                        ) : null}
                        <span className='truncate'>{shop.shopName}</span>
                      </Link>
                    ) : null}
                    {item.price != null ? (
                      <div className='flex flex-wrap items-center gap-2'>
                        <ProductPrice price={item.price} plain />
                        {item.priceDropped && item.watchedPrice != null ? (
                          <span className='text-xs font-medium text-emerald-700'>
                            Down from{' '}
                            <ProductPrice price={item.watchedPrice} plain />
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {!item.isPublished ? (
                      <p className='text-xs text-destructive'>
                        No longer published
                      </p>
                    ) : null}
                    <p className='text-xs text-muted-foreground'>
                      Saved{' '}
                      {formatDateTime(new Date(item.createdAt)).dateTime}
                    </p>
                  </div>
                </div>
                <WishlistRemoveButton productId={item.productId} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
