import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/shared/product/product-card'
import ShopCatalogControls from '@/components/shared/product/shop-catalog-controls'
import ShopFollowButton from '@/components/shared/product/shop-follow-button'
import { getPublicSellerShop, shopHref } from '@/lib/actions/shop.actions'
import { getShopFollowStatus } from '@/lib/actions/shop-follow.actions'
import { getWishlistStatusesForProducts } from '@/lib/actions/wishlist.actions'
import { countShopFollowers } from '@/lib/db/shop-follows'

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

  return (
    <div className='page-shell space-y-8 p-4 md:p-6'>
      <div className='space-y-3'>
        <p className='font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground'>
          Seller shop
        </p>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
