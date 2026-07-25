import Link from 'next/link'
import { auth } from '@/auth'
import { listSellerProducts } from '@/lib/actions/seller.actions'
import { findUserById } from '@/lib/db/users'
import { listLowStockProductsForSeller } from '@/lib/notify/low-stock'
import SellerProductPublishToggle from './seller-product-publish-toggle'
import SellerProductStockPriceForm from './seller-product-stock-price-form'
import SellerProductImageForm from './seller-product-image-form'

export const metadata = { title: 'Seller products' }

export default async function SellerProductsPage() {
  let products: Awaited<ReturnType<typeof listSellerProducts>> = []
  let error: string | null = null
  let lowStock: Awaited<ReturnType<typeof listLowStockProductsForSeller>> = []
  let threshold = 5

  try {
    products = await listSellerProducts()
    const session = await auth()
    if (session?.user?.id) {
      const user = await findUserById(session.user.id)
      threshold = user?.lowStockThreshold ?? 5
      lowStock = await listLowStockProductsForSeller(session.user.id, threshold)
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load products'
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold'>Your products</h2>
          <p className='text-sm text-muted-foreground'>
            Listings you own ({products.length})
          </p>
        </div>
        <Link
          href='/seller/products/new'
          className='rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground'
        >
          New product
        </Link>
      </div>

      {lowStock.length > 0 ? (
        <div className='rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm'>
          <p className='font-medium text-amber-900 dark:text-amber-200'>
            {lowStock.length} listing{lowStock.length === 1 ? '' : 's'} at or
            below {threshold} units
          </p>
          <ul className='mt-2 space-y-1 text-amber-950/80 dark:text-amber-100/80'>
            {lowStock.map((item) => (
              <li key={item.productId}>
                <Link
                  href={`/product/${item.slug}`}
                  className='underline hover:no-underline'
                >
                  {item.name}
                </Link>{' '}
                — {item.stockQuantity} left
                {item.stockQuantity <= 0 ? ' (out of stock)' : ''}
              </li>
            ))}
          </ul>
          <p className='mt-2 text-xs'>
            Adjust threshold in{' '}
            <Link href='/account/settings' className='underline'>
              notification settings
            </Link>
            .
          </p>
        </div>
      ) : null}

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No listings yet.{' '}
          <Link href='/seller/products/new' className='text-primary underline'>
            Create your first product
          </Link>
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {products.map((product) => {
            const stock = Number(product.stockQuantity ?? 0)
            const isLow = stock <= threshold
            return (
              <li
                key={product.id}
                className={
                  isLow
                    ? 'space-y-3 border-l-4 border-l-amber-500 p-4'
                    : 'space-y-3 p-4'
                }
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <Link
                      href={`/product/${product.slug}`}
                      className='font-semibold text-primary hover:underline'
                    >
                      {product.name}
                    </Link>
                    <p className='text-sm text-muted-foreground'>
                      {product.isPublished ? 'Published' : 'Draft'}
                      {isLow
                        ? ` · Low stock (${stock})`
                        : ` · Stock ${stock}`}
                    </p>
                  </div>
                  <SellerProductPublishToggle
                    productId={product.id}
                    isPublished={Boolean(product.isPublished)}
                  />
                </div>
                <SellerProductImageForm
                  productId={product.id}
                  imageUrl={product.images?.[0]}
                />
                <SellerProductStockPriceForm
                  productId={product.id}
                  price={Number(product.price)}
                  stockQuantity={stock}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
