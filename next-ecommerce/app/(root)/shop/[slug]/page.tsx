import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/shared/product/product-card'
import ShopCatalogControls from '@/components/shared/product/shop-catalog-controls'
import ShopFollowButton from '@/components/shared/product/shop-follow-button'
import { getPublicSellerShop, shopHref } from '@/lib/actions/shop.actions'
import { getShopFollowStatus } from '@/lib/actions/shop-follow.actions'
import { getWishlistStatusesForProducts } from '@/lib/actions/wishlist.actions'
import { countShopFollowers } from '@/lib/db/shop-follows'
import { shouldUnoptimizeProductImage } from '@/lib/storage/product-image-url'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const data = await getPublicSellerShop(slug)
  if (!data) {
    return { title: 'Shop not found' }
  }
  return {
    title: data.shop.shopName,
    description:
      data.shop.bio || `Browse products from ${data.shop.shopName}`,
  }
}

export default async function PublicSellerShopPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; sort?: string; stock?: string }>
}) {
  const { slug } = await props.params
  const searchParams = await props.searchParams
  const data = await getPublicSellerShop(slug, {
    q: searchParams.q,
    sort: searchParams.sort,
    inStock: searchParams.stock,
  })
  if (!data) notFound()

  const { shop, products, query, sort, inStockOnly } = data
  if (slug === shop.accountId && shop.shopSlug && shop.shopSlug !== slug) {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (sort !== 'newest') params.set('sort', sort)
    if (inStockOnly) params.set('stock', '1')
    const qs = params.toString()
    redirect(qs ? `${shopHref(shop)}?${qs}` : shopHref(shop))
  }

  const basePath = shopHref(shop)
  const [wishlist, followStatus, followerCount] = await Promise.all([
    getWishlistStatusesForProducts(products.map((p) => p._id)),
    getShopFollowStatus(shop.accountId),
    countShopFollowers(shop.accountId),
  ])
  const wishlisted = new Set(wishlist.wishlistedIds)
  const filteredEmpty = products.length === 0 && shop.productCount > 0
  const bannerUrl = shop.shopBannerUrl

  return (
    <div className='space-y-8'>
      {bannerUrl ? (
        <div className='relative -mx-4 -mt-4 h-44 w-auto overflow-hidden md:h-60'>
          <Image
            src={bannerUrl}
            alt={`${shop.shopName} banner`}
            fill
            priority
            className='object-cover'
            sizes='100vw'
            unoptimized={shouldUnoptimizeProductImage(bannerUrl)}
          />
        </div>
      ) : null}

      <div className='page-shell space-y-8 px-0 md:px-2'>
        <div className='space-y-3'>
          <p className='font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>
            Seller shop
          </p>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-4'>
              {shop.shopLogoUrl ? (
                <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted md:h-20 md:w-20'>
                  <Image
                    src={shop.shopLogoUrl}
                    alt={`${shop.shopName} logo`}
                    fill
                    className='object-cover'
                    sizes='80px'
                    unoptimized={shouldUnoptimizeProductImage(shop.shopLogoUrl)}
                  />
                </div>
              ) : null}
              <div className='min-w-0'>
              <h1 className='font-display text-3xl font-extrabold tracking-tight md:text-4xl'>
                {shop.shopName}
                {shop.verified ? (
                  <span className='ml-3 align-middle text-sm font-medium text-emerald-700'>
                    Verified
                  </span>
                ) : null}
              </h1>
              {shop.bio ? (
                <p className='mt-2 max-w-2xl text-muted-foreground'>{shop.bio}</p>
              ) : null}
              {(shop.websiteUrl || shop.instagramUrl || shop.xUrl) && (
                <p className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
                  {shop.websiteUrl ? (
                    <a
                      href={shop.websiteUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline hover:text-primary'
                    >
                      Website
                    </a>
                  ) : null}
                  {shop.instagramUrl ? (
                    <a
                      href={shop.instagramUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline hover:text-primary'
                    >
                      Instagram
                    </a>
                  ) : null}
                  {shop.xUrl ? (
                    <a
                      href={shop.xUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='underline hover:text-primary'
                    >
                      X
                    </a>
                  ) : null}
                </p>
              )}
              <p className='mt-2 text-sm text-muted-foreground'>
                {shop.productCount} published product
                {shop.productCount === 1 ? '' : 's'}
                {followerCount > 0
                  ? ` · ${followerCount} follower${followerCount === 1 ? '' : 's'}`
                  : ''}
                {query
                  ? ` · ${products.length} match${
                      products.length === 1 ? '' : 'es'
                    } for “${query}”`
                  : ''}
                {inStockOnly && !query
                  ? ` · showing ${products.length} in stock`
                  : ''}
                <span className='mx-2'>·</span>
                <span className='font-mono text-xs'>/shop/{shop.shopSlug}</span>
              </p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <ShopFollowButton
                sellerAccountId={shop.accountId}
                initialFollowing={followStatus.following}
                signedIn={followStatus.signedIn}
                isOwnShop={followStatus.isOwnShop}
              />
              <Link
                href='/search'
                className='text-sm text-muted-foreground underline hover:text-primary'
              >
                Browse all products
              </Link>
            </div>
          </div>
          {shop.productCount > 0 ? (
            <ShopCatalogControls
              basePath={basePath}
              query={query}
              sort={sort}
              inStockOnly={inStockOnly}
            />
          ) : null}
        </div>

        {products.length === 0 ? (
          <p className='rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground'>
            {filteredEmpty
              ? 'No products match these filters.'
              : 'This shop has no published products yet.'}{' '}
            {filteredEmpty ? (
              <Link href={basePath} className='underline'>
                Clear filters
              </Link>
            ) : null}
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                wishlisted={wishlisted.has(product._id)}
                signedIn={wishlist.signedIn}
                shop={{
                  accountId: shop.accountId,
                  shopSlug: shop.shopSlug,
                  shopName: shop.shopName,
                  shopLogoUrl: shop.shopLogoUrl,
                }}
              />
            ))}
          </div>
        )}

        {shop.shippingPolicy || shop.returnsPolicy ? (
          <section id='shop-policies' className='space-y-4 border-t pt-8'>
            <div>
              <h2 className='font-display text-xl font-extrabold tracking-tight'>
                Shop policies
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                Shipping and returns for {shop.shopName}.
              </p>
            </div>
            <div className='grid gap-6 md:grid-cols-2'>
              {shop.shippingPolicy ? (
                <div className='space-y-2'>
                  <h3 className='text-sm font-medium'>Shipping</h3>
                  <p className='whitespace-pre-wrap text-sm text-muted-foreground'>
                    {shop.shippingPolicy}
                  </p>
                </div>
              ) : null}
              {shop.returnsPolicy ? (
                <div className='space-y-2'>
                  <h3 className='text-sm font-medium'>Returns</h3>
                  <p className='whitespace-pre-wrap text-sm text-muted-foreground'>
                    {shop.returnsPolicy}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
