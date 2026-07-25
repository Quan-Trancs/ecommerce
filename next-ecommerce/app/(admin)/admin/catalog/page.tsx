import Link from 'next/link'
import { listAdminCatalogProducts } from '@/lib/actions/admin.actions'
import AdminCatalogCreateForm from './admin-catalog-create-form'
import AdminCatalogPublishToggle from './admin-catalog-publish-toggle'
import AdminCatalogStockPriceForm from './admin-catalog-stock-price-form'

export const metadata = { title: 'Admin catalog' }

export default async function AdminCatalogPage() {
  let products: Awaited<ReturnType<typeof listAdminCatalogProducts>> = []
  let error: string | null = null

  try {
    products = await listAdminCatalogProducts()
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load catalog'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold'>Catalog moderation</h2>
        <p className='text-sm text-muted-foreground'>
          Platform-wide products via <code>/v1/admin/products</code> (
          {products.length} total)
        </p>
      </div>

      <AdminCatalogCreateForm />

      {error ? (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
          No products in the store catalog yet.
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {products.map((product) => (
            <li key={product.id} className='space-y-3 p-4'>
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
                    {product.sellerAccountId
                      ? ` · Seller ${product.sellerAccountId.slice(0, 8)}…`
                      : ' · Platform-owned'}
                  </p>
                </div>
                <AdminCatalogPublishToggle
                  productId={product.id}
                  isPublished={Boolean(product.isPublished)}
                />
              </div>
              <AdminCatalogStockPriceForm
                productId={product.id}
                price={product.price}
                stockQuantity={product.stockQuantity ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
