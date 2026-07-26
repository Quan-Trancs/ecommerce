import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/shared/product/product-card'
import { getPublicSellerShop } from '@/lib/actions/shop.actions'
import { getWishlistStatusesForProducts } from '@/lib/actions/wishlist.actions'
import { auth } from '@/auth'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const data = await getPublicSellerShop(id)
  if (!data) {
    return { title: 'Shop not found' }
  }
  return {
    title: data.shop.shopName,
    description:
      data.shop.bio ||
      `Browse products from ${data.shop.shopName}`,
  }
}

export default async function PublicSellerShopPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const data = await getPublicSellerShop(id)
  if (!data) notFound()

  const { shop, products } = data
  const session = await auth()
  const wishlist = await getWishlistStatusesForProducts(
    products.map((p) => p._id)
  )
  const wishlisted = new Set(wishlist.wishlistedIds)

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
            </p>
          </div>
          <Link
            href='/search'
            className='text-sm text-muted-foreground underline hover:text-primary'
          >
            Browse all products
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <p className='rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground'>
          This shop has no published products yet.
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
