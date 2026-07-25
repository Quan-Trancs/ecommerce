import Link from 'next/link'
import { listSellerProducts } from '@/lib/actions/seller.actions'
import ProductPrice from '@/components/shared/product/product-price'
import SellerProductPublishToggle from './seller-product-publish-toggle'

export const metadata = { title: 'Seller products' }

export default async function SellerProductsPage() {
  let products: Awaited<ReturnType<typeof listSellerProducts>> = []
  let error: string | null = null

  try {
    products = await listSellerProducts()
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
          {products.map((product) => (
            <li
              key={product.id}
              className='flex flex-wrap items-center justify-between gap-3 p-4'
            >
              <div className='min-w-0'>
                <Link
                  href={`/product/${product.slug}`}
                  className='font-semibold text-primary hover:underline'
                >
                  {product.name}
                </Link>
                <p className='text-sm text-muted-foreground'>
                  Stock {product.stockQuantity ?? 0} ·{' '}
                  {product.isPublished ? 'Published' : 'Draft'}
                </p>
              </div>
              <div className='flex items-center gap-3'>
                <ProductPrice price={product.price} plain />
                <SellerProductPublishToggle
                  productId={product.id}
                  isPublished={Boolean(product.isPublished)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
